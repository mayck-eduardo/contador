# Como gerar o APK do Contador

O aplicativo foi configurado para gerar APKs (arquivos instaláveis do Android) facilmente usando o serviço em nuvem **EAS (Expo Application Services)**, que é a maneira oficial recomendada.

## 1. Instalando a Ferramenta EAS
Abra o seu terminal na pasta do projeto (`contador`) e execute:

```bash
npm install -g eas-cli
```

## 2. Fazendo Login na sua Conta Expo
Se você não tem uma conta no Expo, crie uma de graça em: [expo.dev](https://expo.dev/)

No terminal, execute:
```bash
eas login
```
E insira seu usuário e senha.

## 3. Gerando seu APK na Nuvem
Basta rodar o seguinte comando:

```bash
eas build -p android --profile preview
```

### O que acontece a seguir?
1. O terminal vai enviar os seus arquivos para os servidores da Expo.
2. Vai demorar alguns minutinhos (normalmente uns 5-10 minutos a primeira vez). Você pode acompanhar o progresso no link que o terminal vai te dar.
3. Quando terminar, o terminal e o site mostrarão um **Link de Download**.
4. É só abrir esse link no seu celular Android, baixar o `.apk` e instalar! 🎉

> O arquivo gerado será o `.apk` e não irá para a Google Play Store, ficando apenas para o seu uso ou de quem você enviar o link.
