Pdf Nummerieren
pdfcpu stamp add -mode text -- " Seite %p von %P " "pos:tc, rot:0, scale:1.0 abs, points:10" input.pdf numbered.pdf

Pdf Splitten Nach Kapitel
pdfcpu split -m bookmark numbered.pdf out/

MP3 Splitten
ffmpeg -i "vo1.mp3" -f segment -segment_time 600 -c copy "teil_%03d.mp3"