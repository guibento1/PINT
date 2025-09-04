# The SoftSkills 

 The SoftSkills é uma plataforma digital desenvolvida para a empresa **Softinsa**, no âmbito da unidade curricular **Projeto Integrado**, do curso de Engenharia Informática. Este projeto tem como objetivo promover a formação interna e a partilha de conhecimento entre colaboradores da organização, através de uma solução multiplataforma (Web e Mobile).

A aplicação permite centralizar o percurso formativo de cada colaborador, disponibilizar conteúdos didáticos, gerir cursos síncronos e assíncronos, bem como incentivar a partilha de conhecimento entre pares. 

Este projeto foi orientado pelos docentes:

- Artur Sousa
- Júlio Florentino
- Luís Soares

Para mais detalhes consulte o website https://microsite.thesoftskills.xyz ( se ainda estiver disponivel (^¬^) )


## Requesitos

Para poder implementar esta solução é necessário fornecer credencias de uma conta firebase com cloud messaging e uma conta com azure blobstorage com os seguintes containers :

- userprofiles | imagens de perfis
- enunciadosavaliacao | enunciados de avaliações
- ficheiroslicao | ficheiros associados a lições e sessões
- submissoes | submissões de utilizadores
- thumbnailscursos | thumbnails de cursos
- anexosposts | anexos de posts

Ter podman (ou docker se quiserem mas tem que alterar scripts), node e flutter instalado.

## Correr o projeto

Para gestão de segredos usamos de variáveis de ambiente.
As variáveis estão dividia por 3 ficheiros .env

backend/.env
```bash
# DB Container

POSTGRES_USER=
POSTGRES_DB=
POSTGRES_PASSWORD=
PGDATA=/var/lib/postgresql/data/pgdata
HOST=

# Azure Credentials

AZURESTORAGE_ACCOUNTNAME=
AZURESTORAGE_ENDPOINT=
AZURESTORAGE_KEY=

# Backend credentials

JWTSECRET=

# Mailgun

MAILGUN_DOMAIN=
MAILGUN_APIKEY=

# Firebase

SERVICE_ACCOUNT=''
```

frontoffice/.env || backoffice/.env
```bash
VITE_API_URL=''
VITE_FIREBASE_CONFIG=''
VITE_FIREBASE_VAPI_KEY=''
```

Após defenidas estas variáveis passamos a configuração do resto do projeto


### Backend

A raiz do projeto localiza-se no backend portanto vamos começar por ai.
---

Na pasta backend contém os scripts necessários para criar um contentor com base de dados vazia automaticamente, basta correr o script `start` , depois para preencher DB com os objetos lógicos é necessário correr os scripts defenidos na pasta `backend/db/scripts`.

Após isso feito na raiz da pasta instalamos os modulos do node `npm install`, dá-se build `npm run build` metemos a API em funcionamento na porta 3000 (quem quiser altera vá para `src/app.js` e mude a o numero da porta).

### FrontOffice e BackOffice

Semelhante á segunda parte da implementação do backend metemos as aplicações web a servir páginas instando as dependencias `npm install`, compilar/comprimir ficheiros `npm run build` e `npm run start` para as iniciar.


### Mobile (Android)

A aplicação mudamos de node para flutter mas é a mesma velha cantiga, instalar dependencias `flutter pub get` e compilar a aplicação `flutter build apk --release` pegar no apk e dar sideload (enquanto se pode . . . ╭∩╮( •̀_•́ )╭∩╮ GOOGLE ).


## Implementação

Para a implementação agora especificando a nossa experiência nós compramos um dominio, metemos um um reverse-proxy com o dominioe certificados a apontar para os 3 serviços e ficou feito, temos serviços e quadlets criados para isso.

Correr todos as entidades acima numa só VPS deve ser possivel mas nós com apenas VPSs de class B1 da azure ( COM 1GB de RAM ( ;´ - `;) ) tivemos que utilizar duas numa mesma subnet, uma com a BD,API e reverse-proxy e a outra com o frontOffice, BackOffice e o microsite. 





