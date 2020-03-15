FROM gitpod/workspace-full

USER gitpod

RUN sudo apt-get update

RUN sudo apt-get install docker-ce docker-ce-cli containerd.io
