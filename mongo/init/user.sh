#!/bin/bash

echo "USER"

RET=1
while [[ RET -ne 0 ]]; do
    echo "=> Waiting for confirmation of MongoDB service startup"
    sleep 1
    mongo admin --eval "help" >/dev/null 2>&1
    RET=$?
done

sleep 5

echo "=> Creating an ${USER} user with a ${_word} password in MongoDB"
mongo admin --eval "db.createUser({user: 'Mathiisss', pwd: 'MewFourt-2', roles:[{role:'root',db:'admin'}]});"
mongo admin --eval "db.auth('Mathiisss','MewFourt-2');"
mongo admin -u Mathiisss -p MewFourt-2 << EOF
use Hypertube
db.createUser({user: 'HypertubeUser', pwd: '42Hypertube42', roles:[{role:'userAdmin',db:'Hypertube'}, {role:'readWrite',db:'Hypertube'}]})
EOF