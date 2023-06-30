from ..swagger_config import *

notification_add = api.model('notification_add', {
    'user_id': fields.Integer(required=True, description='ID do utilizador'),
})

notification_delete = api.model('notification_delete', {
    'user_id': fields.Integer(required=True, description='ID do utilizador'),
})

notification_get = api.model('notification_get', {
    'user_id': fields.Integer(required=True, description='ID do utilizador'),
})


login = api.model('Login', {
    'username': fields.String(required=True, description='Nome do utilizador'),
    'password': fields.String(required=True, description='Password do utilizador')
})

logout = api.model('Logout', {
    'access_token': fields.String(required=True, description='access_token')
})

refresh = api.model('Refresh', {
    'refresh_token': fields.String(required=True, description='refresh_token')
})

user_create_model = api.model('Create User', {
    'username': fields.String(required=True, description='Nome do utilizador'),
    'password': fields.String(required=True, description='Password do utilizador'),
    'email': fields.String(required=True, description='Email do utilizador'),
    'name': fields.String(required=True, description='Nome do utilizador'),
    'password': fields.String(required=True, description='Senha do utilizador'),
})

user_info_model = api.model('UserInfo', {
    'name': fields.String(required=True, description='Nome do utilizador'),
    'nipc': fields.String(required=True, description='NIPC'),
    'address': fields.String(required=True, description='Endereço'),
    'postal': fields.String(required=True, description='Código postal'),
    'phone': fields.String(required=True, description='Telefone'),
    'email': fields.String(required=True, description='E-mail'),
    'ident_type': fields.String(required=True, description='Tipo de identificação'),
    'ident_value': fields.String(required=True, description='Valor da identificação'),
    'descr': fields.String(required=True, description='Descrição')
})

change_password_model = api.model('ChangePassword', {
    'old_password': fields.String(description='Senha atual', required=True),
    'new_password': fields.String(description='Nova senha', required=True)

})
password_recovery_model = api.model('RecoverPassword', {
    'email': fields.String(required=True, description='E-mail do usuário'),
})

password_reset_model = api.model('ResetPassword', {
    'token': fields.String(required=True, description='Token de recuperação de senha'),
    'new_password': fields.String(required=True, description='Nova senha')
})

entity_model = api.model('Entities', {
    'name': fields.String(required=True, description='Nome do utilizador'),
    'nipc': fields.String(required=True, description='NIPC'),
    'address': fields.String(required=True, description='Endereço'),
    'postal': fields.String(required=True, description='Código postal'),
    'phone': fields.String(required=True, description='Telefone'),
    'email': fields.String(required=True, description='E-mail'),
    'ident_type': fields.String(required=True, description='Tipo de identificação'),
    'ident_value': fields.String(required=True, description='Valor da identificação'),
    'descr': fields.String(required=True, description='Descrição')
})

entity_pk_model = api.model('EntityPkModel', {
    'pk': fields.Integer(required=True, description='Chave primária da entidade')
})

entity_update_model = api.model('EntityUpdateModel', {
    'name': fields.String(description='Nome do utilizador'),
    'nipc': fields.String(description='NIPC'),
    'address': fields.String(description='Endereço'),
    'postal': fields.String(description='Código postal'),
    'phone': fields.String(description='Telefone'),
    'email': fields.String(description='E-mail'),
    'ident_type': fields.String(description='Tipo de identificação'),
    'ident_value': fields.String(description='Valor da identificação'),
    'descr': fields.String(description='Descrição')
})

document_model_new = api.model('Document', {
    'nipc': fields.String(required=True, description='NIPC'),
    'name': fields.String(required=True, description='Nome do utilizador'),
    'tt_type': fields.String(required=True, description='Tipo'),
    'ts_associate': fields.String(required=True, description='Associado'),
    'memo': fields.String(required=True, description='Observações'),
})


# Modelo de dados para a atualização ou inserção de passos
document_step_model = api.model('DocumentStep', {
    'what': fields.String(required=True, description='O que'),
    'who': fields.String(required=True, description='Quem'),
    'memo': fields.String(required=True, description='Memo')
})
