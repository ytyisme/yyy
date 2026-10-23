#!/bin/zsh
cd -- "${0:A:h}"
rtk proxy python3 scripts/start-xiaoyan-local.py
echo '按回车关闭此窗口（小岩会继续运行）'
read
