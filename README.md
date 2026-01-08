# Messe Hotel Stock Manager - Configuração do Banco de Dados

Este projeto pode rodar em modo **Mock** (dados no navegador) ou **Real** (MySQL).
Para usar o MySQL, siga os passos abaixo.

## 1. Instalação do Banco de Dados (MySQL)

A maneira mais fácil é instalar o **XAMPP**:
1. Faça o download e instale o [XAMPP](https://www.apachefriends.org/pt_br/index.html).
2. Abra o **XAMPP Control Panel**.
3. Clique em **Start** no módulo **MySQL** (e Apache se quiser usar o phpMyAdmin).

## 2. Aceder e Criar a Base de Dados

1. Abra o navegador e aceda a: `http://localhost/phpmyadmin`
2. Na barra lateral esquerda, clique em **Novo**.
3. Nome da base de dados: `messe_db`
4. Clique em **Criar**.

## 3. Criar as Tabelas

1. Com a base de dados `messe_db` selecionada, clique na aba **SQL** no topo.
2. Abra o ficheiro `backend/schema.txt` (ou copie do schema.md) deste projeto.
3. Copie todo o conteúdo e cole na caixa de texto do phpMyAdmin.
4. Clique em **Executar** (Go).

Agora suas tabelas (`users`, `stock_items`, `requisitions`, etc.) estão criadas.

## 4. Iniciar o Servidor Backend (API)

Para que o site comunique com o banco de dados, você precisa rodar o servidor Node.js.

### Opção A (Recomendada - Windows)
1. Abra a pasta `backend`.
2. Dê um duplo clique no ficheiro **`start.bat`**.
3. Uma janela preta vai abrir indicando que o servidor está a rodar. Não feche essa janela.

### Opção B (Terminal Manual)
1. Abra um terminal na pasta do projeto.
2. Entre na pasta backend: `cd backend`
3. Instale as dependências: `npm install`
4. Inicie o servidor (Cuidado com o nome): `node server.js`

## 5. Ligar o Frontend ao Backend

1. Abra o ficheiro `services/mockData.ts`.
2. Altere a linha 10 para: `const USE_REAL_BACKEND = true;`
3. Salve o ficheiro. A aplicação agora vai ler e gravar dados no seu MySQL.
