# /backend/api/swagger_config.py

from flask_restx import Api, Resource, fields, Namespace


api = Api(doc='/docs')


def create_api(app, ns):
    global api
    api.init_app(app)
    api.version = '1.0'
    api.title = 'AINTAR API'
    api.description = 'Aintar API'    
    api.contact = "contact@aintar.com"
    api.license = "Aintar License"
    api.ui = True
    api.default = "AINTAR"
    api.default_label = "AINTAR endpoints"
    api.validate = False
    api.authorizations = {
        'Bearer Auth': {
            'type': 'apiKey',
            'scheme': 'Bearer',
            'BearerFormat': 'TOKEN', 
            'in': 'header',
            'name': 'Authorization'
        }
    }
    api.namespaces.clear()
    api.namespaces = []


    # Swagger UI configuration
    api.swagger_ui_bundle_js = '/swaggerui/swagger-ui-bundle.js'
    api.swagger_ui_standalone_preset_js = '/swaggerui/swagger-ui-standalone-preset.js'
    api.swagger_ui_css = '/swaggerui/swagger-ui.css'
    api.swagger_ui_favicon_ico = '/swaggerui/favicon.ico'
    api.swagger_ui_bundle_js = '/swaggerui/swagger-ui-bundle.js'
    api.swagger_ui_doc_expansion = 'list'
    api.swagger_ui_jsoneditor = True
    api.swagger_ui_operation_id = True
    api.swagger_ui_request_duration = True
    api.swagger_ui_deep_linking = True
    api.swagger_ui_filter = True
    api.swagger_ui_show_extensions = True
    api.swagger_ui_show_common_extensions = True
    api.swagger_ui_display_operation_id = True
    api.swagger_ui_display_request_duration = True    
    api.add_namespace(ns, path='/')






