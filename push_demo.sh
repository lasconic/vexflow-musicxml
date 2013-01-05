#!/bin/bash
# Deploy demo.
#
# Pushes only JavaScript, tests, and supporting HTML (tutorial, playground)

/bin/echo -n "Target directory: "
read TARGET
/bin/echo -n "User@SSH server:  "
read SSH_TO
SCP_TO="$SSH_TO:$TARGET"

echo Building...
scons -c
./build.sh

ssh $SSH_TO "mkdir -p $TARGET; mkdir -p $TARGET/support"
if [ "$?" != "0" ]
  then
  echo "Cannot create remote directory."
  exit 1
fi

echo Copying over compiled sources...
scp build/vexflow/vexflow-min.js $SCP_TO/support

echo Copying over tests...
ssh $SSH_TO rm -rf tests/
scp -r build/tests $SCP_TO
scp build/tests/flow.html $SCP_TO/tests/index.html

echo Copy over docs...
scp -r docs $SCP_TO

echo Done.
