FROM node:16.17.0

RUN npm install -g node-gyp

RUN apt-get -y install git

ENV TARGET_FOLDER_NAME="iot-adapter"
RUN git clone https://github.com/PharmaLedger-IMI/iot-adapter.git $TARGET_FOLDER_NAME

RUN cd $TARGET_FOLDER_NAME && \
    npm install --unsafe-perm

RUN cd $TARGET_FOLDER_NAME && \
    echo 'npm run iot-adapter-server & \n tail -f /dev/null' >> startup-script.sh
RUN cd $TARGET_FOLDER_NAME && cat startup-script.sh

EXPOSE 8080/tcp

CMD cd $TARGET_FOLDER_NAME && \
    bash startup-script.sh
