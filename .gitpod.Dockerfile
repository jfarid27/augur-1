FROM gitpod/workspace-full

USER gitpod

RUN sudo apt-get -q update

RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

RUN nvm install v12 && nvm use v12

RUN npm install -g yarn
