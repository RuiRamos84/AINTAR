# /myapp/myapp/api/auth/utils.py
from datetime import datetime, date, timedelta
from jwt import ExpiredSignatureError, InvalidTokenError
import jwt as pyjwt
from functools import wraps
import os
from flask import request
import jwt
from sqlalchemy import text
from ..database import db
import re
import xml.etree.ElementTree as ET
from ..swagger_config import *
from flask_jwt_extended import *
from ..config import *
from flask_mail import Message
from ..config import mail
from werkzeug.utils import secure_filename




METADATA_TYPES = {
    "ident_types": "SELECT * FROM aintar_server.vst_0001",
    "types": "SELECT * FROM vst_doctype order by value",
    "associates": "SELECT * FROM vsl_associate order by name",
    "what": "SELECT * FROM vst_document_step$what order by pk",
    "who": "SELECT * FROM vst_document_step$who order by pk",
}

def fetch_meta_data(tipo):
    if tipo == "order":
        try:
            who_query = "SELECT * FROM vst_document_step$who order by pk"
            what_query = "SELECT * FROM vst_document_step$what order by pk"
            who_result = db.session.execute(text(who_query)).fetchall()
            what_result = db.session.execute(text(what_query)).fetchall()
            who_result = [row._asdict() for row in who_result]
            what_result = [row._asdict() for row in what_result]
            return {"who": who_result, "what": what_result}
        except Exception as e:
            return {"error": f"Erro ao buscar metadados do tipo {tipo}: {str(e)}"}
    else:
        query = METADATA_TYPES.get(tipo)
        if query is None:
            return {"error": "Tipo de metadado inválido."}
        try:
            result = db.session.execute(text(query)).fetchall()
            result = [row._asdict() for row in result]
            return {tipo: result}
        except Exception as e:
            return {"error": f"Erro ao buscar metadados do tipo {tipo}: {str(e)}"}

    

def format_message(message):
    start_success = message.find("<success>") + len("<success>")
    end_success = message.find("</success>")
    start_success = message.find("<sucess>") + len("<sucess>")
    end_success = message.find("</sucess>")
    start_error = message.find("<error>") + len("<error>")
    end_error = message.find("</error>")

    if start_success > -1 and end_success > -1:
        return message[start_success:end_success].strip()
    elif start_error > -1 and end_error > -1:
        return message[start_error:end_error].strip()

    return message.strip()

    
def fsf_client_notificationget():
    try:
        result = db.session.execute(
            text("SELECT * FROM vsl_client$self"))
        row = result.fetchone()
        print(row)
        return row.notification
    except Exception as e:
        return {'erro': f"Erro ao buscar notificação: {str(e)}"}, 500


def fsf_client_notificationadd(user_id):
    try:
        result = db.session.execute(
            text("SELECT aintar_server.fsf_client_notificationadd(:user_id)"),
            {"user_id": user_id},
        )
        s = result.fetchone()[0]
        db.session.commit()
        return format_message(s)
    except Exception as e:
        return f"Erro ao adicionar notificação: {str(e)}"


def fsf_client_notificationclean(user_id):
    try:
        result = db.session.execute(
            text("SELECT aintar_server.fsf_client_notificationclean(:user_id)"),
            {"user_id": user_id},
        )
        s = result.fetchone()[0]
        db.session.commit()
        return format_message(s)
    except Exception as e:
        return f"Erro ao deletar notificação: {str(e)}"
    




def send_email(to, subject, body):
    msg = Message(subject, recipients=[to], body=body)
    mail.send(msg)


def send_activation_email(name, email, id, activation_code):

    try:
        subject = "Ativação da conta AINTAR"
        body = f"Olá {name},\n\nObrigado por se registrar em AINTAR. Para ativar sua conta, utilize o seguinte código de ativação:\n\n http://localhost:3000/activation/{id}/{activation_code}\n\n Atenciosamente,\n Equipe AINTAR"
        msg = Message(subject, recipients=[email])
        msg.body = body
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar o e-mail: {str(e)}")
        return False


def send_courtesy_email(name, email):
    try:
        subject = "Conta AINTAR ativada com sucesso"
        body = f"Olá {name},\n\nParabéns! Sua conta AINTAR foi ativada com sucesso. Agora você pode acessar todos os recursos da plataforma.\n\nAtenciosamente,\nEquipe AINTAR"
        msg = Message(subject, recipients=[email])
        msg.body = body
        mail.send(msg)
        print("E-mail enviado com sucesso")  # Adicione este print
    except Exception as e:
        print(f"Erro ao enviar o e-mail: {e}")
        return False



# Adicione a função para enviar o e-mail de recuperação de password
def send_password_recovery_email(email, temp_token):
    try:
        subject = "Recuperação de password AINTAR"
        reset_password_url = f"http://localhost:3000/reset_password?token={temp_token}"
        body = f"""Olá,

        Aqui está o seu link para redefinir a password:

        {reset_password_url}

        Por favor, acesse o link acima para redefinir sua password. O link é válido por 15 minutos.

        Atenciosamente,
        Equipe AINTAR"""
        msg = Message(subject, recipients=[email])
        msg.body = body
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar o e-mail: {str(e)}")
        return False

def fs_login(username, passwd):
    try:
        result = db.session.execute(text("SELECT aintar_server.fs_login(:username, :passwd)"), {
            'username': username, 'passwd': passwd})
        s = result.fetchone()[0]

        if s is None:
            return None, None, None

        # Analisar o XML
        root = ET.fromstring(s)
        success = root.find('sucess')
        error = root.find('error')

        if success is not None:
            session, profil = success.text.split(';')
            return session, profil, None
        elif error is not None:
            return None, None, error.text
        else:
            return None, None, None
    except Exception as e:
        return None, None, str(e)


def is_temp_password(password):
    pattern = r'^xP!tO.{7}$'
    return bool(re.match(pattern, password))


def fs_logout(session):
    result = db.session.execute(
        text("SELECT aintar_server.fs_logout(:session)"), {'session': session})
    db.session.commit()
    xml_response = result.fetchone()[0]

    # Analisar o XML
    root = ET.fromstring(xml_response)
    success = root.find('sucess')
    error = root.find('error')

    if success is not None and success.text == "LOGOUT COM SUCESSO":
        return {"success": True}
    elif error is not None:
        return {"success": False, "message": format_message(error.text)}
    else:
        return {"success": False, "message": "Erro desconhecido"}


def fs_setsession(session):
    try:
        query = text("SELECT aintar_server.fs_setsession(:session)")
        result = db.session.execute(query, {"session": session})
        db.session.commit()
        first_row = result.fetchone()
        if first_row:
            # Acessa o valor da primeira coluna da linha
            message = first_row[0]
            parsed_message = format_message(message)
            if str(parsed_message) == str(session):
                return True
        return False
    except Exception as e:
        print(f"Erro ao definir a sessão: {str(e)}")
        return False




def set_session(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Extrair o token do cabeçalho de autorização
        token = request.headers.get('Authorization').split(' ')[1]
        # Decodificar o token JWT e extrair o session_id
        secret_key = os.getenv('SECRET_KEY')
        decoded_token = pyjwt.decode(token, secret_key, algorithms=['HS256'])
        session = decoded_token['session']
        fs_setsession(session)
        return fn(*args, **kwargs)
    return wrapper


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace("Bearer ", "")
        if not token:
            return {'erro': 'Token não fornecido'}, 403
        try:
            payload = pyjwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            session_id = payload['session']
        except ExpiredSignatureError:
            return {'erro': 'Token expirado. Por favor, faça login novamente.'}, 401
        except InvalidTokenError:
            return {'erro': 'Token inválido'}, 401
        return f(session_id, *args, **kwargs)
    return decorated


def get_current_user():
    token = request.headers.get('Authorization').split(' ')[1]
    print(f'Token: {token}')  # print the token
    secret_key = os.getenv('SECRET_KEY')
    decoded_token = jwt.decode(token, secret_key, algorithms=['HS256'])
    session_id = decoded_token['session']
    print(f'Session ID: {session_id}')  # print the session_id
    return session_id


# Adicione a função fs_passwd_recover
def fs_passwd_recover(email):
    try:
        query = text("SELECT aintar_server.fs_passwd_recover(:e)")
        result = db.session.execute(query, {"e": email}).scalar()
        db.session.commit()

        if result is not None:
            result_xml = ET.fromstring(result)
            success = result_xml.findtext(".//sucess")
            if success is not None:
                return success
        return None
    except Exception as e:
        print(f"Erro ao recuperar a password: {str(e)}")
        return None



# Função para criar o token com a password temporária
def create_temp_password_token(temp_password):
    secret_key = os.getenv('SECRET_KEY')
    expiration_time = datetime.utcnow() + timedelta(minutes=15)
    payload = {"temp_password": temp_password, "exp": expiration_time}
    token = pyjwt.encode(payload, secret_key, algorithm='HS256')
    return token


def update_password(old_password, new_password):
    # Chamar o procedimento armazenado fs_passwd_change para alterar a password do utilizador
    query = text("SELECT aintar_server.fs_passwd_change(:o, :n)")
    result = db.session.execute(
        query, {"o": old_password, "n": new_password}).scalar()
    db.session.commit()

    # Verificar se a alteração de password foi bem-sucedida
    result_xml = ET.fromstring(result)
    success_node = result_xml.find(".//sucess")
    if success_node is not None:
        return True, success_node.text
    else:
        # A alteração de password falhou
        error_message_node = result_xml.find(".//error_message")
        if error_message_node is not None:
            error_message = format_message(error_message_node.text)
        else:
            error_message = 'Erro ao alterar a password do utilizador.'
        return False, error_message




def handle_file_upload(files, pk_result, tb_document):
    """Processar o upload de arquivos."""
    try:
        reg_query = text("select regnumber from vbl_document where pk = :pk")
        reg_result = db.session.execute(reg_query, {'pk': tb_document}).scalar()
        print('numero de registro:', reg_result)

        # Verificar e/ou criar diretório específico para o pedido
        UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER')
        order_folder = os.path.join(UPLOAD_FOLDER, str(reg_result))
        os.makedirs(order_folder, exist_ok=True)
        print('Diretório criado:', order_folder)

        # Anexar arquivos ao pedido
        file_counter = 0  # Iniciar contador de ficheiros
        file_descriptions = request.form.getlist('descriptions')
        print('descrições:', file_descriptions)
        for i, file in enumerate(files[:5]):  # Limitar ao máximo 5 arquivos
            # Gerar o filename usando a função aintar_server.fbo_document_stepannex()
            filename_query = text(
                "SELECT aintar_server.fbo_document_stepannex(:d, :t, :m, :e)")
            description = file_descriptions[i] if i < len(
                file_descriptions) else 'file description'
            extension = str(os.path.splitext(file.filename)[1])
            print(extension)
            filename_result = db.session.execute(
                filename_query, {'d': tb_document, 't': 3, 'm': description, 'e': extension}).scalar()
            db.session.commit()

            # Garantir que o nome do ficheiro é seguro para guardar no sistema de ficheiros
            filename = secure_filename(filename_result)
            print('filename:', filename)

            # Gerar o caminho completo para guardar o ficheiro
            filepath = os.path.join(order_folder, filename)
            print('filepath:', filepath)

            # Guardar o ficheiro
            try:
                file.save(filepath)
                file_counter += 1  # Incrementar contador de ficheiros
                print("Ficheiro salvo")
            except Exception as e:
                print(f"Erro ao salvar o ficheiro: {str(e)}")
        print(f"Foram adicionados {file_counter} ficheiros.")
    except Exception as e:
        print(f"Erro ao processar o upload de ficheiros: {str(e)}")
        return False



def insert_new_movement(who, what, pk_result, tb_document):
    """Inserir um novo movimento."""
    insert_query = text(
        "INSERT INTO aintar_server.vbf_document_step (pk, tb_document, what, who) "
        "VALUES (:pk_result, :tb_document, :what, :who)"
    )
    db.session.execute(
        insert_query,
        {'pk_result': pk_result, 'tb_document': tb_document, 'what': what, 'who': who}
    )
    db.session.commit()


def get_file_info_from_database(pk):
    query = text(
        "SELECT filename FROM aintar_server.vbl_document_step WHERE pk = :pk")
    file_info = db.session.execute(query, {'pk': pk}).fetchone()
    return file_info



