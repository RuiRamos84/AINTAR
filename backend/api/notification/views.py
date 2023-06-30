# /backend/api/notification/views.py

from flask import Blueprint, request
from flask_socketio import SocketIO, join_room, emit
from ..auth.utils import fsf_client_notificationget, fsf_client_notificationadd, fsf_client_notificationclean


def create_socketio(app):
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
    connected_users = []

    @socketio.on('connect')
    def on_connect(data):
        print(f'Cliente conectado: {request.sid}')

    @socketio.on('disconnect')
    def on_disconnect():
        # print(f'Cliente desconectado: {request.sid}')
        # Remova o usuário da lista de usuários conectados ao se desconectar
        user = next(
            (x for x in connected_users if x['request_sid'] == request.sid), None)
        if user:
            connected_users.remove(user)

    @socketio.on('join')
    def on_join(data):
        user_id = data['userId']
        # print(f'Usuário com ID {user_id} entrou na sala - {request.sid}')
        join_room(user_id)

        # Procurando pelo usuário na lista
        user = next(
            (x for x in connected_users if x['user_id'] == user_id), None)

        if user:
            # Usuário encontrado, atualizar o sid
            user['request_sid'] = request.sid
        else:
            # Usuário não encontrado, adicionar à lista
            connected_users.append(
                {'user_id': user_id, 'request_sid': request.sid})

        # print("connected_users", connected_users)
        emit('join_room', room=request.sid)

    @socketio.on('order_created')
    def on_order_created(data):
        order_id = data['order_id']
        who_id = data['who_id']
        # print(f'Recebido evento "order_created" com o pedido {order_id} e o who_id {who_id}')

        recipient_id = data['who_id']
        # Verifique se o usuário de destino está conectado
        user = next(
            (x for x in connected_users if x['user_id'] == recipient_id), None)
        if user:
            # Usuário está conectado, emita o alerta diretamente para a sala
            fsf_client_notificationadd(recipient_id)
            emit('order_created', order_id, room=user['request_sid'])
            # print(f'Evento "order_created" emitido para o utilizador {recipient_id} com o pedido {order_id}')
        else:
            # Usuário não está conectado, salve a notificação no banco de dados
            # Adicione a notificação ao usuário na base de dados
            # print(f'Usuário {recipient_id} não está conectado, salvando notificação no banco de dados')
            fsf_client_notificationadd(recipient_id)

    @socketio.on('forward_order')
    def on_forward_order(data):
        recipient_id = data['userId']
        order_id = data['orderId']
        # print(f'Recebido evento "forward_order" para o utilizador {recipient_id} com o pedido {order_id}')
        fsf_client_notificationadd(recipient_id)
        for x in connected_users:
            if str(x['user_id']) == str(recipient_id):
                # print(recipient_id, x['user_id'])
                emit('order_forwarded', recipient_id, room=x['request_sid'])
                # print(f'Evento "order_forwarded" emitido para o utilizador {recipient_id} com o pedido {order_id}')

    return socketio
