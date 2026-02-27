docker --version
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y
docker --version
mkdir ~/vanderlande
cd vanderlande
pwd
ls -la /dev/tty*
sudo usermod -a -G dialout $USER
newgrp dialout
groups
[200~cat /dev/ttyUSB0~
cat /dev/ttyUSB0
stty -F /dev/ttyUSB0 115200
cat /dev/ttyUSB0
