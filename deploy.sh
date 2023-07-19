#!/bin/bash

# Navegar para o diretório do projeto
cd C:\\Users\\ruira\\Desktop\\Aintar_Project\\frontend

# Construir o projeto
npm run build

# Muda para a unidade D: no servidor remoto
plink aintar\\rui.ramos@172.16.2.35: "D:"

# Copiar a pasta de build para o servidor remoto
pscp -r build aintar\\rui.ramos@172.16.2.35:/APP/AINTAR/frontend
