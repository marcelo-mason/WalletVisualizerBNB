@echo off
git add .
git commit -m "%*"
git push heroku master
git push origin