@echo off
echo.
echo  Bolsai Analyzer - Iniciando...
echo.
echo  Abrindo no navegador: http://localhost:8080
echo  Para parar: feche esta janela
echo.
start http://localhost:8080
py proxy.py
pause
