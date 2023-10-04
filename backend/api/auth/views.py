# backend/api/auth/views.py

from flask import Response, stream_with_context
from flask import send_file
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import os
import json
import traceback
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import *
from sqlalchemy import text
from ..database import db
from .models import *
import re
import xml.etree.ElementTree as ET
from .utils import *
from ..swagger_config import *
from ..notification.views import create_socketio
from ..config import mail
from datetime import datetime


load_dotenv('.env')
ns = Namespace('Auth', description='Operações de autenticação')


@ns.route('/send_mail', methods=['POST'])
class SendMail(Resource):
    @ns.doc('send_mail')
    def post(self):
        '''Envia um email para o utilizador.'''
        data = request.get_json()
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')
        msg = Message(subject, sender="", recipients=[email])
        msg.body = message
        mail.send(msg)
        return {'message': 'Email enviado com sucesso.'}, 200
    



@ns.route('/notification')
class Notification(Resource):
    @ns.doc('get_notification')
    @ns.expect(notification_get)
    @token_required  
    @set_session  
    def get(self, session): 
        '''Obtém as notificações do usuário.'''

        # Chamar a função para obter as notificações
        result = fsf_client_notificationget()
        return result


    @ns.doc('add_notification')
    @ns.expect(notification_add)
    def post(self):
        '''Adiciona uma notificação ao usuário.'''
        data = request.get_json()
        user_id = data.get('user_id')
        # Chamar a função para adicionar a notificação
        fsf_client_notificationadd(user_id)

        return {'message': 'Notificação adicionada com sucesso.'}, 200

    @ns.doc('delete_notification')
    @ns.expect(notification_delete)
    def delete(self):
        '''Remove as notificações do usuário.'''
        data = request.get_json()
        user_id = data.get('user_id')
        # Chamar a função para remover as notificações
        fsf_client_notificationclean(user_id)

        return {'message': 'Notificações removidas com sucesso.'}, 200




@ns.route('/login')
class Login(Resource):
    @ns.doc('login')
    @ns.expect(login)
    def post(self):
        '''Faz o login do utilizador e retorna um token de acesso.'''
        from .. import api
        data = request.get_json()
        print("data", data)
        username = data.get('username')
        password = data.get('password')
        session, profil, error_message = fs_login(username, password)
        if session is None:
            formatted_error = format_message(
                error_message) if error_message else 'Utilizador ou password incorretos'
            return {'error': formatted_error}, 401
        is_temp = is_temp_password(password)
        additional_claims = {"session": session, "profil": profil}
        access_token = create_access_token(
            identity=session, additional_claims=additional_claims)
        refresh_token = create_refresh_token(
            identity=session, additional_claims=additional_claims)       
        fs_setsession(session)
        user_info_query = text("SELECT * FROM vsl_client$self")
        user_info_result = db.session.execute(user_info_query).fetchone()
        user_id = user_info_result.pk if user_info_result else None
        user_name = user_info_result.client_name if user_info_result else None
        notification_count = user_info_result.notification if user_info_result else None
        return jsonify({
            'user_id': user_id, 'user_name': user_name, 'profil': profil, 'is_temp': is_temp,
            'access_token': access_token, 'refresh_token': refresh_token, 'notification_count': notification_count
        })
    
    
@ns.route('/logout')
@ns.header('Authorization', 'Bearer token', required=True)
class Logout(Resource):
    @ns.doc('logout')
    @ns.expect('logout')
    @jwt_required()
    def delete(self):
        '''Realiza o logout do utilizador'''
        try:
            session = get_jwt_identity()
            result = fs_logout(session)
            if result["success"]:
                return {"message": "Logout realizado com sucesso"}, 200
            else:
                return {"error": result.get("message", "Erro ao executar o logout")}, 400
        except Exception as e:
            return {"error": format_message(str(e))}, 500


@ns.route('/refresh')
@ns.header('Authorization', 'Bearer token', required=True)
class RefreshToken(Resource):
    @ns.doc('refresh_token')
    @api.doc('get_something')
    @ns.expect('refresh')
    @jwt_required(refresh=True)
    def post(self):
        """
        Gera um novo token de acesso e um novo token de atualização com base no token de atualização fornecido.
        """
        current_user = get_jwt_identity()
        current_token = get_jwt()

        # Obter 'session' e 'profil' do token JWT
        session = current_token["session"]
        profil = current_token["profil"]

        # Gerar novo access_token e refresh_token com a session e perfil do token anterior
        access_token = create_access_token(
            identity=current_user, additional_claims={"session": session, "profil": profil})
        refresh_token = create_refresh_token(
            identity=current_user, additional_claims={"session": session, "profil": profil})

        response = jsonify({"access_token": access_token,
                            "refresh_token": refresh_token})
        return response



@ns.route('/create_user_ext')
class CreateUser(Resource):
    @ns.doc('create_user_ext')
    @ns.expect(user_create_model)
    @ns.response(201, 'Utilizador criado com sucesso')
    @ns.response(400, 'Dados do utilizador não fornecidos')
    @ns.response(500, 'Erro ao enviar o e-mail')
    def post(self):
        """Criar um novo Utilizador"""
        dados = request.get_json()
        nipc = dados.get('nipc')
        name = dados.get('name')
        email = dados.get('email')
        password = dados.get('password')

        if not nipc or not name or not email or not password:
            return {'erro': 'Dados do utilizador não fornecidos'}, 400

        try:

            query = text(
                "SELECT fs_createuser_ext(:i, :n, :e, :p)")

            result = db.session.execute(
                query, {"i": nipc, "n": name, "e": email, "p": password}).scalar()

            db.session.commit()

            result_xml = ET.fromstring(result)
            sucess = result_xml.findtext(".//sucess")

            if sucess:
                id, activation_code = sucess.split(';')
                email_sent = send_activation_email(
                    name, email, id, activation_code)

                if email_sent:
                    db.session.commit()
                    return {'mensagem': 'Utilizador criado com sucesso', 'id': id}, 201
                else:
                    return {'erro': 'Erro ao enviar o e-mail'}, 500
            else:
                error = result_xml.findtext('.//error')
                if error:
                    return {'erro': error}, 400
                else:
                    return {'erro': 'Erro ao criar o utilizador'}, 400

        except Exception as e:
            error_message = None
            # Verifique se a exceção contém "USERNAME JÁ EXISTE"
            if "USERNAME JÁ EXISTE" in str(e):
                error_message = "USERNAME JÁ EXISTE"

            else:
                result_xml = ET.fromstring(f"<error>{str(e)}</error>")
                error_element = result_xml.find(".//error")
                if error_element is not None:
                    error_message = error_element.text.strip()
                else:
                    error_message = str(e)
            return {'erro': f"{error_message}", 'tt_type_erro': type(e).__name__, 'traceback': traceback.format_exc()}, 500


@ns.route('/activation/<int:id>/<int:activation_code>')
class ActivateUser(Resource):
    @ns.doc('activate_user')
    @ns.param('id', 'ID do Utilizador', 'path')
    @ns.param('activation_code', 'Código de ativação', 'path')
    @ns.response(200, 'Utilizador ativado com sucesso')
    @ns.response(400, 'Código de ativação inválido')
    @ns.response(500, 'Erro ao ativar o Utilizador')
    def get(self, id, activation_code):
        """Ativar um Utilizador"""
        try:
            query = text("SELECT fs_validate(:i, :k)")
            result = db.session.execute(
                query, {"i": id, "k": activation_code}).scalar()

            db.session.commit()
            result_xml = ET.fromstring(result)
            success_node = result_xml.find(".//sucess")
            if success_node is not None:
                # Extrair e-mail e nome do utilizador do nó de sucesso
                user_data = success_node.text.split(";")
                email = user_data[0]
                name = user_data[1]

                # Enviar e-mail de cortesia
                send_courtesy_email(name, email)
                return {'mensagem': 'Utilizador ativado com sucesso'}, 200
            else:
                # ativação falhou
                error_message_node = result_xml.find(".//error_message")
                if error_message_node is not None:
                    error_message = error_message_node.text
                else:
                    error_message = 'Erro ao ativar o utilizador.'
                return {'erro': error_message}, 400

        except Exception as e:
            error_message = None
            result_xml = ET.fromstring(f"<error>{str(e)}</error>")
            error_element = result_xml.find(".//error")
            if error_element is not None:
                error_message = error_element.text.strip()
            else:
                error_message = str(e)
            return {'erro': f"{error_message}", 'tt_type_erro': type(e).__name__, 'traceback': traceback.format_exc()}, 500


@ns.route('/user_info', endpoint='User_Info')
class UserInfo(Resource):
    @ns.doc('user_info')
    @token_required
    @set_session
    @ns.response(200, 'Informações do utilizador obtidas com sucesso')
    @ns.response(400, 'Erro ao obter informações do utilizador')
    def get(self, session_id):
        """Obter informações do utilizador logado"""
        try:
            # Obter o pk do utilizador logado usando a função fs_entity()
            user_id_query = text("SELECT fs_entity() AS pk")
            user_id_result = db.session.execute(user_id_query).fetchone()
            user_id = user_id_result.pk

            # Executar a consulta para obter as informações do utilizador
            user_query = text(
                "SELECT * FROM vbf_entity WHERE pk = :i")
            user_result = db.session.execute(
                user_query, {"i": user_id}).fetchone()
            ident_types_list = fetch_meta_data('ident_types')
            ident_types_list = ident_types_list['ident_types']

            if user_result:
                user_info = user_result._asdict()
                return {'user_info': user_info, 'ident_types': ident_types_list}, 200

            else:
                return {'erro': 'Erro ao obter informações do utilizador'}, 400

        except Exception as e:
            return {'erro': f"Erro ao obter informações do utilizador: {str(e)}"}, 500


    @ns.doc('update_user_info')
    @token_required
    @set_session
    @ns.expect(user_info_model)
    @ns.response(200, 'Informações do utilizador atualizadas com sucesso')
    @ns.response(400, 'Erro ao atualizar informações do utilizador')
    def put(self, session_id):
        """Atualizar informações do utilizador logado"""
        try:

            # Extrair o token do cabeçalho de autorização
            token = request.headers.get('Authorization').split(' ')[1]

            # Decodificar o token JWT e extrair o session_id
            secret_key = os.getenv('SECRET_KEY')
            decoded_token = jwt.decode(token, secret_key, algorithms=['HS256'])
            session_id = decoded_token['session']

            # Executar o fs_setsession com o número de sessão
            fs_setsession(session_id)

            user_id_query = text("SELECT fs_entity() AS pk")
            user_id_result = db.session.execute(user_id_query).fetchone()
            user_id = user_id_result.pk

            # Obter os dados do utilizador para atualizar
            raw_data = request.get_json()
            dados = {
                "name": raw_data.get("name", None),
                "nipc": raw_data.get("nipc", None),
                "address": raw_data.get("address", None),
                "postal": raw_data.get("postal", None),
                "phone": raw_data.get("phone", None),
                "email": raw_data.get("email", None),
                "ident_type": raw_data.get("ident_type", None),
                "ident_value": raw_data.get("ident_value", None),
                "descr": raw_data.get("descr", None),
            }
            ident_types_list = fetch_meta_data(tipo='ident_types')

            # Atualizar os dados do utilizador na tabela vbf_entity
            update_query = text("""
                UPDATE vbf_entity
                SET name = COALESCE(:name, name),
                    nipc = COALESCE(:nipc, nipc),
                    address = COALESCE(:address, address),
                    postal = COALESCE(:postal, postal),
                    phone = COALESCE(:phone, phone),
                    email = COALESCE(:email, email),
                    ident_type = COALESCE(:ident_type, ident_type),
                    ident_value = COALESCE(:ident_value, ident_value),
                    descr = COALESCE(:descr, descr)
                WHERE pk = :i
            """)
            db.session.execute(update_query, {**dados, "i": user_id})
            db.session.commit()

            return {'mensagem': 'Informações do utilizador atualizadas com sucesso'}, 200

        except Exception as e:
            return {'erro': f"Erro ao atualizar informações do utilizador: {str(e)}"}, 500


@ns.route('/change_password', endpoint='Change_Password')
class ChangePassword(Resource):
    @ns.doc('change_password')
    @ns.expect(change_password_model)
    @ns.response(200, 'Password alterada com sucesso')
    @ns.response(400, 'Dados inválidos')
    @ns.response(401, 'Não autorizado')
    @ns.response(500, 'Erro interno do servidor')
    @token_required
    @set_session
    def put(self, session_id):  
        """Alterar a password do utilizador"""
        try:
            # Obter a password atual e a nova password do corpo da solicitação
            data = request.get_json()
            old_password = data.get('old_password')
            new_password = data.get('new_password')

            # Chamar a função update_password
            success, message = update_password(old_password, new_password)  


            if success:
                formatted_message = format_message(message)
                return {'mensagem': formatted_message}, 200
            else:
                formatted_error = format_message(message)
                return {'erro': formatted_error}, 400

        except Exception as e:
            return {'erro': format_message(str(e))}, 500




@ns.route('/password_recovery')
class PasswordRecovery(Resource):
    @ns.expect(password_recovery_model)
    @ns.response(200, 'E-mail enviado com sucesso')
    @ns.response(400, 'Dados inválidos')
    @ns.response(500, 'Erro interno do servidor')
    def post(self):
        """Recuperar password do utilizador"""
        data = request.get_json()
        email = data.get('email')

        if not email:
            return {'erro': 'E-mail não fornecido'}, 400

        try:
            temp = fs_passwd_recover(email)

            if temp is not None:
                # Criar o token com a password temporária
                temp_token = create_temp_password_token(temp)

                # Modifique a função send_password_recovery_email para incluir o token no link enviado por e-mail
                if send_password_recovery_email(email, temp_token):
                    return {'mensagem': 'E-mail enviado com sucesso'}, 200
                else:
                    return {'erro': 'Erro ao enviar o e-mail'}, 500
            else:
                raise ValueError('fs_passwd_recover retornou None')
        except Exception as e:
            if isinstance(e, ValueError):
                return {'erro': str(e), 'tt_type_erro': type(e).__name__, 'traceback': traceback.format_exc()}, 500
            else:
                erro = str(e)
                xml_string = re.search('<result>.*?</result>', erro, re.DOTALL)
                if xml_string:

                    parsed_xml = xmltodict.parse(xml_string.group())
                    json_message = json.dumps(parsed_xml)

                    return {'erro': f"{json_message}", 'tt_type_erro': type(e).__name__, 'traceback': traceback.format_exc()}, 500
                else:
                    return {'erro': f"{str(e)}", 'tt_type_erro': type(e).__name__, 'traceback': traceback.format_exc()}, 500


@ns.route('/reset_password')
class ResetPassword(Resource):
    @ns.expect(password_reset_model)
    @ns.response(200, 'Password redefinida com sucesso')
    @ns.response(400, 'Dados inválidos')
    @ns.response(500, 'Erro interno do servidor')
    def post(self):
        """Redefinir a password do utilizador"""
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('newPassword')
        token = data.get('token')

        if not email or not new_password or not token:
            return {'erro': 'Dados inválidos'}, 400

        # Verificar se o token é válido
        try:
            payload = jwt.decode(token, os.getenv(
                'SECRET_KEY'), algorithms=['HS256'])
            password = payload.get('temp_password')
        except jwt.ExpiredSignatureError:
            return {'erro': 'Token expirado'}, 400
        except jwt.InvalidTokenError:
            return {'erro': 'Token inválido'}, 400

        # Redefinir a password do utilizador
        try:
            session_id, _, _ = fs_login(
                email, password)
            success, message = update_password(
                session_id, password, new_password)
            if success:
                return {'mensagem': message}, 200
            else:
                return {'erro': message}, 500
        except Exception as e:
            return {'erro': f"{str(e)}", 'tt_type_erro': type(e).__name__, 'traceback': traceback.format_exc()}, 500


@ns.route('/entities', endpoint='Entities')
class Entities(Resource):
    @ns.doc('list_entities')
    @token_required
    @set_session
    @ns.response(200, 'Lista de entidades obtida com sucesso')
    @ns.response(400, 'Erro ao obter lista de entidades')
    def get(self, session_id):
        """Listar todas as entidades"""
        try:
            # Extrair o token do cabeçalho de autorização
            token = request.headers.get('Authorization').split(' ')[1]

            # Decodificar o token JWT e extrair o session_id
            secret_key = os.getenv('SECRET_KEY')
            decoded_token = jwt.decode(token, secret_key, algorithms=['HS256'])
            session_id = decoded_token['session']

            # Executar o fs_setsession com o número de sessão
            fs_setsession(session_id)
            # Consultar todas as entidades usando a view vbf_entity
            entities_query = text(
                "SELECT * FROM vbf_entity order by pk")
            entities_result = db.session.execute(entities_query).fetchall()
            ident_types_list = fetch_meta_data('ident_types')


            if entities_result:
                entities_list = [entity._asdict() for entity in entities_result]
                return {'entities': entities_list, "ident_type": ident_types_list}, 200
            else:
                return {'erro': 'Erro ao obter lista de entidades'}, 400

        except Exception as e:
            return {'erro': f"Erro ao obter lista de entidades: {str(e)}"}, 500

    @ns.doc('add_entity')
    @token_required
    @set_session
    @ns.expect(entity_model)
    @ns.response(201, 'Entidade adicionada com sucesso')
    @ns.response(400, 'Erro ao adicionar entidade')
    def post(self, session_id):
        try:
            # Obter os dados da entidade para adicionar
            raw_data = request.get_json()
            dados = {
                "name": raw_data.get("name", None),
                "nipc": raw_data.get("nipc", None),
                "address": raw_data.get("address", None),
                "postal": raw_data.get("postal", None),
                "phone": raw_data.get("phone", None),
                "email": raw_data.get("email", None),
                "ident_type": raw_data.get("ident_type", None),
                "ident_value": raw_data.get("ident_value", None),
                "descr": raw_data.get("descr", None),
            }
            ident_types_list = fetch_meta_data('ident_types')
            print(dados);

            # # Gerar um valor de PK usando a função fs_nextcode()
            # pk_query = text("SELECT fs_nextcode()")
            # pk_result = db.session.execute(pk_query).scalar()
            # dados['pk'] = pk_result

            # Chamar a função fbf_entity para adicionar uma nova entidade
            add_query = text("""
                INSERT INTO vbf_entity (name, nipc, address, postal, phone, email, ident_type, ident_value, descr)
                VALUES (:name, :nipc, :address, :postal, :phone, :email, :ident_type, :ident_value, :descr)
            """)
            db.session.execute(add_query, dados)
            db.session.commit()

            return {'mensagem': 'Entidade adicionada com sucesso'}, 201

        except Exception as e:
            error_message = format_message(str(e))
            if 'NIF/NIPC JÁ EXISTE' in error_message:
                return {'erro': 'O NIPC já está em utilização'}, 400
            else:
                return {"erro": error_message}, 500

    @ns.doc('update_entity')
    @token_required
    @set_session
    @ns.expect(entity_model)
    @ns.response(200, 'Entidade atualizada com sucesso')
    @ns.response(400, 'Erro ao atualizar entidade')
    def put(self, session_id):
        try:            
            # Obter os dados da entidade para atualizar
            raw_data = request.get_json()
            dados = {
                "pk": raw_data.get("pk", None),
                "name": raw_data.get("name", None),
                "nipc": raw_data.get("nipc", None),
                "address": raw_data.get("address", None),
                "postal": raw_data.get("postal", None),
                "phone": raw_data.get("phone", None),
                "email": raw_data.get("email", None),
                "ident_type": raw_data.get("ident_type", None),
                "ident_value": raw_data.get("ident_value", None),
                "descr": raw_data.get("descr", None),
            }

            update_query = text("""
                UPDATE vbf_entity
                SET name = COALESCE(:name, name),
                    nipc = COALESCE(:nipc, nipc),
                    address = COALESCE(:address, address),
                    postal = COALESCE(:postal, postal),
                    phone = COALESCE(:phone, phone),
                    email = COALESCE(:email, email),
                    ident_type = COALESCE(:ident_type, ident_type),
                    ident_value = COALESCE(:ident_value, ident_value),
                    descr = COALESCE(:descr, descr)
                WHERE pk = :pk
            """)
            db.session.execute(update_query, dados)
            db.session.commit()

            return {'mensagem': 'Entidade atualizada com sucesso'}, 200

        except Exception as e:
            return {'erro': f"Erro ao atualizar entidade: {str(e)}"}, 500


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, timedelta):
            return str(obj)
        return super().default(obj)



@ns.route('/documents', endpoint='Documents')
class Documents(Resource):
    @ns.doc('list_documents')
    @token_required
    @set_session
    @ns.response(200, 'Lista de documentos obtida com sucesso')
    @ns.response(400, 'Erro ao obter lista de documentos')
    def get(self, session_id):
        """Listar todos os documentos"""
        try:            
            # Consultar todos os documentos usando a view vbf_document
            documents_query = text("SELECT * FROM vbl_document")
            documents_result = db.session.execute(documents_query).fetchall()

            if documents_result:
                documents_list = []
                for document in documents_result:
                    document_dict = document._asdict()

                    # Converter objetos datetime em strings
                    if isinstance(document_dict["submission"], datetime):
                        document_dict["submission"] = document_dict["submission"].isoformat(
                        )

                    documents_list.append(document_dict)

                return {'documents': documents_list}, 200
            else:
                return {'erro': 'Erro ao obter lista de documentos'}, 400

        except Exception as e:
            return {'erro': f"Erro ao obter lista de documentos: {str(e)}"}, 500

    @ns.doc('create_document')
    @token_required
    @set_session
    @ns.expect(document_model_new)
    @ns.response(201, 'Pedido criado com sucesso')
    @ns.response(400, 'Erro ao criar o pedido')
    def post(self, session_id):
        """Criar um novo pedido"""
        try:
            # Extrair os dados do pedido do corpo da solicitação
            data = request.form
            print ('data: ', data)

            # Verificar se o NIPC existe na tabela vbf_entity
            nipc = data['nipc']
            entity_query = text("SELECT * FROM vbf_entity WHERE nipc = :nipc")
            entity_result = db.session.execute(
                entity_query, {'nipc': nipc}).fetchone()

            if entity_result:
                # Extrair a coluna "pk" da tabela vbf_entity
                ts_entity = entity_result.pk
                tt_type = data['tt_type']
                ts_associate = data['ts_associate']
                memo = data['memo']
                
                print('memo: ', memo)
                # Gerar um valor de PK usando a função fs_nextcode()
                pk_query = text("SELECT fs_nextcode()")
                pk_result = db.session.execute(pk_query).scalar()
                print('pk:', pk_result)

                # Inserir o novo pedido na tabela
                insert_query = text(
                    """INSERT INTO vbf_document (pk, ts_entity, tt_type, ts_associate, memo) 
                    VALUES (:pk, :ts_entity, :tt_type, :ts_associate, :memo)"""
                )
                db.session.execute(
                    insert_query,
                    {'pk': pk_result, 'ts_entity': ts_entity, 'tt_type': tt_type,
                        'ts_associate': ts_associate, 'memo': memo }
                )
                db.session.commit()

                # Criar diretório específico para o pedido
                reg_query = text("select regnumber from vbl_document where pk = :pk")
                reg_result = db.session.execute(reg_query, {'pk': pk_result}).scalar()
                print (reg_result)

                # Verificar e/ou criar diretório específico para o pedido
                UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER')
                order_folder = os.path.join(UPLOAD_FOLDER, str(reg_result))
                os.makedirs(order_folder, exist_ok=True)

                # Anexar arquivos ao pedido
                files = request.files.getlist('files')
                file_descriptions = request.form.getlist(
                    'fileDescriptions')  # Obter as descrições dos arquivos

                for i, file in enumerate(files[:5]):  # Limitar ao máximo 5 arquivos
                    # Gerar o filename usando a função fbo_document_stepannex()
                    filename_query = text(
                        "SELECT fbo_document_stepannex(:d, :t, :m, :e)")
                    description = file_descriptions[i] if i < len(
                        file_descriptions) else 'file description'
                    extension = str(os.path.splitext(file.filename)[1])
                    print(extension)
                    filename_result = db.session.execute(
                        filename_query, {'d': pk_result, 't': 2, 'm': description, 'e': extension}).scalar()
                    db.session.commit()
                    # Adicione a extensão original do arquivo ao filename
                    extension = os.path.splitext(file.filename)[1]
                    filename_result += extension

                    # Garantir que o nome do ficheiro é seguro para guardar no sistema de ficheiros
                    filename = secure_filename(filename_result)

                    # Gerar o caminho completo para guardar o ficheiro
                    filepath = os.path.join(order_folder, filename)

                    # Guardar o ficheiro
                    file.save(filepath)

                # Obter o PK do who no novo pedido
                who_id = db.session.execute(text(
                    "SELECT who FROM vbf_document_step WHERE tb_document = :pk and ord = 0"), {'pk': pk_result}).scalar()

                db.session.commit()

                return {'message': 'Pedido criado com sucesso', 'order_id': pk_result, 'who_id': who_id}, 201

            else:
                return {'erro': 'O NIPC fornecido não existe.'}, 400 
        except Exception as e:
            formatted_error = format_message(str(e))
            return {'erro': f"{formatted_error}"}, 500


@ns.route('/metaData', endpoint='MetaData')
class MetaData(Resource):
    @ns.doc('get_meta_data')
    @token_required
    @set_session
    @ns.response(200, 'Meta data obtida com sucesso')
    @ns.response(400, 'Erro ao obter meta data')
    def get(self, session_id):
        try:
            # Obtém o parâmetro dataType da solicitação
            data_type = request.args.get('tipo')

            types_query = text("SELECT * FROM vst_doctype order by value")
            types_result = db.session.execute(types_query).fetchall()

            associates_query = text(
                "SELECT * FROM vsl_associate order by name")
            associates_result = db.session.execute(associates_query).fetchall()

            what_query = text(
                "SELECT * FROM vst_document_step$what order by pk")
            what_result = db.session.execute(what_query).fetchall()

            who_query = text("SELECT * FROM vst_document_step$who order by pk")
            who_result = db.session.execute(who_query).fetchall()

            # Adiciona a consulta para obter o título e descrição de cada vista
            views_query = text(
                "SELECT pk, name, memo FROM vbr_meta order by pk")
            views_result = db.session.execute(views_query).fetchall()

            # Converte RowProxy para dicionários
            types_result = [row._asdict() for row in types_result]
            associates_result = [row._asdict() for row in associates_result]
            what_result = [row._asdict() for row in what_result]
            who_result = [row._asdict() for row in who_result]
            views_result = [row._asdict() for row in views_result]

            response_data = {
                'types': types_result,
                'associates': associates_result,
                'views': views_result
            }

            if data_type == "order":
                response_data['who'] = who_result
                response_data['what'] = what_result

            return response_data, 200
        except Exception as e:
            return {'erro': f"Erro ao obter meta data: {str(e)}"}, 500



@ns.route('/document_self', endpoint='DocumentSelf')
class DocumentSelf(Resource):
    @ns.doc('list_document_self')
    @token_required
    @set_session
    @ns.response(200, 'Lista de atribuídos a si obtida com sucesso')
    @ns.response(400, 'Não existem Pedidos atribuídos a si')
    def get(self, session_id):
        """Obter a lista de pedidos atribuídos utilizador logado"""
        try:
            fs_session = text("SELECT * FROM fs_session()")
            db.session.execute(fs_session).fetchone()
            document_self_query = text("SELECT * FROM vbl_document$self")
            document_self_result = db.session.execute(
                document_self_query).fetchall()

            if document_self_result:
                document_self_list = []
                for document in document_self_result:
                    document_dict = document._asdict()

                    # Converter objetos datetime em strings
                    if isinstance(document_dict["submission"], datetime):
                        document_dict["submission"] = document_dict["submission"].isoformat(
                        )

                    document_self_list.append(document_dict)

                    db.session.commit()

                return {'document_self': document_self_list}, 200
            else:
                return {'mensagem': 'Não existem Pedidos atribuídos a si'}, 200
        except Exception as e:
            return {'erro': f"Erro ao obter lista de document_self: {str(e)}"}, 500
        

@ns.route('/document_owner', endpoint='DocumentOwner')
class DocumentSelf(Resource):
    @ns.doc('list_document_owner')
    @token_required
    @set_session
    @ns.response(200, 'Lista de pedido criados por si obtida com sucesso')
    @ns.response(400, 'Não existem Pedidos criados por si')
    def get(self, session_id):
        """Obter a lista de pedidos criados pelo utilizador logado"""
        try:
            fs_session = text("SELECT * FROM fs_session()")
            db.session.execute(fs_session).fetchone()
            document_self_query = text("SELECT * FROM vbl_document$owner")
            document_self_result = db.session.execute(
                document_self_query).fetchall()

            if document_self_result:
                document_self_list = []
                for document in document_self_result:
                    document_dict = document._asdict()

                    # Converter objetos datetime em strings
                    if isinstance(document_dict["submission"], datetime):
                        document_dict["submission"] = document_dict["submission"].isoformat(
                        )

                    document_self_list.append(document_dict)

                    db.session.commit()

                return {'document_owner': document_self_list}, 200
            else:
                return {'mensagem': 'Não existem Pedidos criados por si'}, 200
        except Exception as e:
            return {'erro': f"Erro ao obter lista de document_owner: {str(e)}"}, 500


@ns.route('/get_document_step/<int:pk>', endpoint='GetDocumentStep')
class GetDocumentStep(Resource):
    @ns.doc('get_document_step')
    @token_required
    @set_session
    @ns.response(200, 'Passos do documento obtidos com sucesso')
    @ns.response(400, 'Erro ao obter passos do documento')
    def post(self, session_id, pk):  # session_id seria passado como parâmetro
        """Criar ou atualizar um passo do documento"""
        try:
            # Consultar todos os passos do documento usando a view vbl_document_step
            document_step_query = text(
                "SELECT * FROM vbl_document_step WHERE tb_document = :pk")
            document_step_result = db.session.execute(
                document_step_query, {'pk': pk}).fetchall()

            if document_step_result:
                document_step_list = []
                for document_step in document_step_result:
                    document_step_dict = document_step._asdict()

                    document_step_list.append(document_step_dict)

                return {'document_step': document_step_list}, 200
            else:
                return {'erro': 'Não existem passos do documento'}, 400

        except Exception as e:
            return {'erro': f"Erro ao obter lista de passos do documento: {str(e)}"}, 500

# Criar ou atualizar passo
@ns.route('/create_or_update_document_step/<int:pk>', endpoint='CreateOrUpdateDocumentStep')
class CreateOrUpdateDocumentStep(Resource):
    @ns.doc('create_or_update_document_step')
    @token_required
    @set_session
    @ns.expect(document_step_model)
    @ns.response(201, 'Passo do documento criado ou atualizado com sucesso')
    @ns.response(400, 'Erro ao criar ou atualizar o passo do documento')
    def post(self, session_id, pk):
        """Criar ou atualizar um passo do documento"""
        try:
            # Extrair os dados do passo do documento do corpo da solicitação
            data = request.form
            tb_document = data.get('tb_document')  # pk do document
            what = data.get('what')
            who = data.get('who')
            memo = data.get('memo')

            # Verifique se o passo do documento já existe na tabela vbf_document_step
            document_step_query = text(
                "SELECT * FROM vbl_document_step WHERE pk = :pk")
            document_step_result = db.session.execute(
                document_step_query, {'pk': pk}).fetchone()
            # Gerar um valor de PK usando a função fs_nextcode()
            pk_query = text("SELECT fs_nextcode()")
            pk_result = db.session.execute(pk_query).scalar()


            # Se a memo existir e um registro de documento correspondente for encontrado, atualize a memo
            if document_step_result is not None and memo:
                update_query = text(
                    "UPDATE vbf_document_step "
                    "SET memo = :memo "
                    "WHERE pk = :pk"
                )
                db.session.execute(
                    update_query,
                    {'pk': pk, 'memo': memo}
                )
                # print('update realizado')
                db.session.commit()


            # Verificar se existem arquivos
            files = request.files.getlist('files')
            print(files)
            if files:
                # Chamar a função handle_file_upload passando os arquivos
                handle_file_upload(files, pk_result, tb_document)
            # Finalmente, se 'who' e 'what' forem fornecidos, insira o novo movimento
            if who and what:
                # print('novo passo iniciado')
                insert_new_movement(who, what, pk_result, tb_document)
                # print('novo passo terminado')
                db.session.commit()         

            # Se chegamos aqui, tudo foi bem-sucedido
            return {'sucesso': 'Passo do documento criado ou atualizado com sucesso'}, 201
        
        except Exception as e:
            return {'erro': f"Erro ao criar ou atualizar o passo do documento: {str(e)}"}, 500


@ns.route('/download_file/<int:pk>/<string:regnumber>', endpoint='DownloadFile')
class DownloadFile(Resource):
    @ns.doc('download_file')
    @token_required
    @set_session
    @ns.response(200, 'Arquivo enviado com sucesso')
    @ns.response(404, 'Arquivo não encontrado')
    def get(self, session_id, regnumber, pk):
        """Baixar um arquivo"""
        try:
            # Procurar o arquivo na base de dados.
            # Você precisa implementar esta função.
            file_info = get_file_info_from_database(pk)
            print("file_info", file_info)

            # Garanta que o nome do arquivo seja seguro para usar em sistemas de arquivos.
            filename = secure_filename(file_info.filename)
            print("filename", filename)

            # Crie um caminho seguro para o arquivo.
            # Suponha que "UPLOAD_FOLDER" seja o diretório onde você armazena os arquivos carregados.
            UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER')
            file_path = os.path.join(UPLOAD_FOLDER, regnumber, filename)
            print(file_path)

            # Verifique se o arquivo existe.
            if os.path.exists(file_path):
                # Se existir, envie o arquivo como uma resposta de download.
                def generate():
                    with open(file_path, "rb") as f:
                        yield from f
                response = Response(stream_with_context(
                    generate()), content_type='application/octet-stream')
                response.headers.set('Content-Disposition', 'attachment', filename=filename)
                return response
            else:
                # Se não existir, retorne um erro.
                return {'erro': "O arquivo não foi encontrado."}, 404
        except Exception as e:
            return {'erro': f"Erro ao baixar o arquivo: {str(e)}"}, 500


@ns.route('/dashboard_data/<view_id>', methods=['GET'])
class DashboardData(Resource):
    def get(self, view_id):
        """Retorna os dados da visualização especificada."""
        try:
            if not 1 <= int(view_id) <= 9:
                return {'erro': "ID da vista inválido."}, 400
            query = db.text(
                f"SELECT * FROM vbr_document_00{view_id}")
            result = db.session.execute(query)
            data = [dict(zip(result.keys(), row)) for row in result]
            json_data = json.dumps({'dados': data}, cls=DateTimeEncoder)
            return Response(response=json_data, status=200, mimetype="application/json")
        except Exception as e:
            return {'erro': str(e)}, 500
