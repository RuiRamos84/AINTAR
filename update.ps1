# Navegar para o diretório do projeto
Set-Location -Path "C:\Users\ruira\Desktop\Aintar_Project\frontend"

# Construir o projeto
npm run build

# Definir as variáveis
$usuario = "aintar\rui.ramos"
$senha = Get-Content "C:\Users\ruira\Desktop\Aintar_Project\PServ.txt" | ConvertTo-SecureString
$credencial = New-Object System.Management.Automation.PSCredential -ArgumentList $usuario, $senha
$serverIP = "172.16.2.35"
$compartilhamentoNome = "app" # Nome do compartilhamento no servidor
$compartilhamento = "\\$serverIP\$compartilhamentoNome"
$caminhoLocal = "C:\Users\ruira\Desktop\Aintar_Project\frontend\build"
$caminhoRemoto = "ServerDrive:\AINTAR\teste" # Ajuste conforme a estrutura do servidor

# Montar o compartilhamento de rede com as credenciais
New-PSDrive -Name "ServerDrive" -PSProvider FileSystem -Root $compartilhamento -Credential $credencial

try {
    # Copiar a pasta de build para o servidor remoto
    Copy-Item -Path $caminhoLocal -Destination $caminhoRemoto -Recurse -Force

    # Mensagem de sucesso
    Write-Host "A exportação foi concluída com sucesso!"
} catch {
    # Mensagem de erro
    Write-Host "Erro durante a exportação: $($_.Exception.Message)"
} finally {
    # Desmontar o compartilhamento de rede, independentemente do sucesso ou falha
    Remove-PSDrive -Name "ServerDrive"
}
