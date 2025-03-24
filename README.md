<h3 align="center">AutoDroid Watcher Client</h3>

## 📝 Índice <a name="summary"></a>

- [📖 Sobre](#about)
- [🏁 Primeiros Passos](#getting_started)
- [📱 Utilização](#usage)
- [⛏️ Tecnologias Utilizadas](#built_using)
- [🤝🏻 Contribuições](docs/CONTRIBUTING.md)
- [💾 Changelog](CHANGELOG.md)

## 📖 Sobre <a name = "about"></a>

Este repositório contém o código-fonte do cliente do AutoDroid Watcher, um projeto desenvolvido para coletar dados de telemetria e conduzir experimentos do software [AutoDroid](https://github.com/MalwareDataLab/autodroid-api) da [Malware DataLab](https://malwaredatalab.github.io/).

Este cliente deve ser instalado nas máquinas onde o [AutoDroid Worker](https://github.com/MalwareDataLab/autodroid-worker) está instalado. O cliente é responsável por coletar os dados de telemetria e enviá-los para o [servidor](https://github.com/MalwareDataLab/autodroid-watcher-server), além de iniciar os experimentos e a coleta de dados.

## 🏁 Primeiros Passos <a name = "getting_started"></a>

Estas instruções irão ajudá-lo a obter uma cópia deste projeto e executá-lo em sua máquina local para fins de desenvolvimento e teste.

### Configuração do AutoDroid Worker

Antes de configurar este cliente, é necessário ter o [AutoDroid Worker](https://github.com/MalwareDataLab/autodroid-worker) instalado e configurado em sua máquina. Siga as instruções de instalação disponíveis no repositório do Worker.

### Configuração deste [AutoDroid Watcher Client](https://github.com/MalwareDataLab/autodroid-watcher-client)

Clone este repositório em sua máquina local:

```bash
git clone https://github.com/MalwareDataLab/autodroid-watcher-client.git
```

Entre no diretório do projeto:

```bash
cd autodroid-watcher-client
```

Este software foi desenvolvido para ser executado em um ambiente Linux.

### Pré-requisitos

Para executar o projeto, você precisará ter o Node.js e o npm instalados em sua máquina. Você pode baixar o Node.js [aqui](https://nodejs.org/) ou através do comando abaixo:

```bash
# Gerenciador de versões do Node.js:
curl -o- https://fnm.vercel.app/install | bash

# Baixar e instalar o Node.js:
fnm install 22.14.0

# Definir a versão do Node.js:
fnm use 22.14.0
```

### Instalação

Após clonar o repositório, entre no diretório do projeto e instale as dependências:

```bash
npm install
```

## 📱 Utilização <a name="usage"></a>

### Executando o Cliente

Para executar o cliente em modo de desenvolvimento, utilize o comando abaixo:

```bash
npm run dev
```

Para executar o cliente em modo de debug:

```bash
npm run dev:debug
```

### Compilando o Projeto

Para compilar o projeto:

```bash
npm run build
```

### Verificação de Código

Para verificar o código:

```bash
npm run lint
```

## ⛏️ Tecnologias Utilizadas <a name = "built_using"></a>

- [TypeScript](https://www.typescriptlang.org/) - Linguagem de programação
- [Node.js](https://nodejs.org/) - Ambiente de execução
- [Socket.io](https://socket.io/) - Biblioteca para comunicação em tempo real
- [Axios](https://axios-http.com/) - Cliente HTTP
- [Winston](https://github.com/winstonjs/winston) - Sistema de logging
- [Sentry](https://sentry.io/) - Monitoramento de erros
- [Dockerode](https://github.com/apocas/dockerode) - Cliente Docker
- [System Information](https://github.com/sebhildebrandt/systeminformation) - Coleta de informações do sistema
- [Zod](https://zod.dev/) - Validação de dados
- [Yargs](https://yargs.js.org/) - Parsing de argumentos de linha de comando

### Geral

É importante mencionar as demais ferramentas que serão utilizadas nas duas partes do projeto:

- [Git](https://git-scm.com/) - Controle de versão
- [Husky](https://typicode.github.io/husky/#/) - Hooks do Git
- [Lint Staged](https://github.com/okonet/lint-staged) - Ferramenta para verificar arquivos commitados
- [Commitizen](https://github.com/commitizen/cz-cli) - Auxiliar para mensagens de commit do Git
- [Commitlint](https://commitlint.js.org/) - Verificador de mensagens de commit do Git
- [Standard Version](https://github.com/conventional-changelog/standard-version) - Gerador de changelog
- [Eslint](https://eslint.org/) - Framework de verificação de código
- [Prettier](https://prettier.io/) - Formatador de código
- [Semver](https://semver.org/) - Versionamento semântico 