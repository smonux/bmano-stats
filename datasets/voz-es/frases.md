# Frases y etiquetas esperadas

Texto sintético, no transcripciones observadas de Whistle. Los nombres son ficticios. Véase README.md para el criterio de anotación.

| ID | Partición | Transcripción | Argumentos esperados (vacío = abstención) |
| --- | --- | --- | --- |
| gol-001-1 | train | Gol nuestro, minuto seis. | {"evento":"gol","equipo":"equipo1"} |
| gol-001-2 | train | Gol nuestro minuto seis | {"evento":"gol","equipo":"equipo1"} |
| gol-001-3 | train | En el minuto seis acabamos de marcar nosotros. | {"evento":"gol","equipo":"equipo1"} |
| gol-002-1 | validation | Marca Ana María, dorsal 0, para nosotros. | {"evento":"gol","equipo":"equipo1","nombre":"Ana María","dorsal":0} |
| gol-002-2 | validation | Marca Ana Maria dorsal cero para nosotros | {"evento":"gol","equipo":"equipo1","nombre":"Ana Maria","dorsal":0} |
| gol-002-3 | validation | Ana María, dorsal cero, acaba de marcar para nosotras. | {"evento":"gol","equipo":"equipo1","nombre":"Ana María","dorsal":0} |
| gol-003-1 | train | Gol de María José, asistencia de Carmen Ruiz. | {"evento":"gol","equipo":"desconocido","nombre":"María José","nombre_relacionado":"Carmen Ruiz"} |
| gol-003-2 | train | Gol de Maria Jose asistencia de Carmen Ruiz | {"evento":"gol","equipo":"desconocido","nombre":"Maria Jose","nombre_relacionado":"Carmen Ruiz"} |
| gol-003-3 | train | Carmen Ruiz se la pasó a María José y ella marcó. | {"evento":"gol","equipo":"desconocido","nombre":"María José","nombre_relacionado":"Carmen Ruiz"} |
| gol-004-1 | train | Gol para ellos, lo mete Lucía. | {"evento":"gol","equipo":"equipo2","nombre":"Lucía"} |
| gol-004-2 | train | Gol para ellos lo mete Lucia | {"evento":"gol","equipo":"equipo2","nombre":"Lucia"} |
| gol-004-3 | train | Lucía acaba de marcar para ellas. | {"evento":"gol","equipo":"equipo2","nombre":"Lucía"} |
| gol-005-1 | train | Ellos marcan con Marta Gómez. | {"evento":"gol","equipo":"equipo2","nombre":"Marta Gómez"} |
| gol-005-2 | train | Ellos marcan con Marta Gomez | {"evento":"gol","equipo":"equipo2","nombre":"Marta Gomez"} |
| gol-005-3 | train | Ese tanto es suyo, de Marta Gómez. | {"evento":"gol","equipo":"equipo2","nombre":"Marta Gómez"} |
| gol-006-1 | test | Gol de Ana María con pase de Lucía. | {"evento":"gol","equipo":"desconocido","nombre":"Ana María","nombre_relacionado":"Lucía"} |
| gol-006-2 | test | Gol de Ana Maria con pase de Lucia | {"evento":"gol","equipo":"desconocido","nombre":"Ana Maria","nombre_relacionado":"Lucia"} |
| gol-006-3 | test | Lucía asistió a Ana María, que la mandó dentro. | {"evento":"gol","equipo":"desconocido","nombre":"Ana María","nombre_relacionado":"Lucía"} |
| gol-007-1 | train | Ana María, dorsal 6, gol para nosotros. | {"evento":"gol","equipo":"equipo1","nombre":"Ana María","dorsal":6} |
| gol-007-2 | train | eh Ana Maria dorsal seis gol para nosotros vale | {"evento":"gol","equipo":"equipo1","nombre":"Ana Maria","dorsal":6} |
| gol-007-3 | train | El tanto nuestro lo ha hecho Ana María, con el seis en la espalda. | {"evento":"gol","equipo":"equipo1","nombre":"Ana María","dorsal":6} |
| gol-008-1 | test | Gol del seis, perdón, del siete nuestro. | {"evento":"gol","equipo":"equipo1","dorsal":7} |
| gol-008-2 | test | Gol del seis perdon del siete nuestro | {"evento":"gol","equipo":"equipo1","dorsal":7} |
| gol-008-3 | test | Primero dije el seis; corrijo: el gol es de nuestro dorsal siete. | {"evento":"gol","equipo":"equipo1","dorsal":7} |
| gol-009-1 | train | Gol del dorsal 123. | {"evento":"gol","equipo":"desconocido"} |
| gol-009-2 | train | Gol del dorsal 123 | {"evento":"gol","equipo":"desconocido"} |
| gol-009-3 | train | Se anotó el tanto del dorsal ciento veintitrés. | {"evento":"gol","equipo":"desconocido"} |
| gol-010-1 | train | Gol de Pablo Martín, dorsal 7, para nuestro equipo. | {"evento":"gol","equipo":"equipo1","nombre":"Pablo Martín","dorsal":7} |
| gol-010-2 | train | Gol de Pablo Martin dorsal siete para nuestro equipo | {"evento":"gol","equipo":"equipo1","nombre":"Pablo Martin","dorsal":7} |
| gol-010-3 | train | Mi equipo acaba de marcar, lo ha hecho Pablo Martín con el siete. | {"evento":"gol","equipo":"equipo1","nombre":"Pablo Martín","dorsal":7} |
| gol-011-1 | train | Gol de Andrés, dorsal 7, asiste Luis, dorsal 9. | {"evento":"gol","equipo":"desconocido","nombre":"Andrés","nombre_relacionado":"Luis","dorsal_relacionado":9,"dorsal":7} |
| gol-011-2 | train | Gol de Andres dorsal siete asiste Luis dorsal nueve | {"evento":"gol","equipo":"desconocido","nombre":"Andres","nombre_relacionado":"Luis","dorsal_relacionado":9,"dorsal":7} |
| gol-011-3 | train | Luis, dorsal nueve, se la puso a Andrés, dorsal 7, para el gol. | {"evento":"gol","equipo":"desconocido","nombre":"Andrés","nombre_relacionado":"Luis","dorsal_relacionado":9,"dorsal":7} |
| gol-012-1 | train | Gol de Diego para ellos. | {"evento":"gol","equipo":"equipo2","nombre":"Diego"} |
| gol-012-2 | train | Gol de Diego para ellos | {"evento":"gol","equipo":"equipo2","nombre":"Diego"} |
| gol-012-3 | train | Diego acaba de hacer el gol del otro equipo. | {"evento":"gol","equipo":"equipo2","nombre":"Diego"} |
| gol-013-1 | train | Pablo Martín marca para ellos, pase de Javier. | {"evento":"gol","equipo":"equipo2","nombre":"Pablo Martín","nombre_relacionado":"Javier"} |
| gol-013-2 | train | Pablo Martin marca para ellos pase de Javier | {"evento":"gol","equipo":"equipo2","nombre":"Pablo Martin","nombre_relacionado":"Javier"} |
| gol-013-3 | train | Javier dio la asistencia y Pablo Martín hizo el gol para ellos. | {"evento":"gol","equipo":"equipo2","nombre":"Pablo Martín","nombre_relacionado":"Javier"} |
| gol-014-1 | validation | Gol de penalti de Óscar para nosotros. | {"evento":"gol","equipo":"equipo1","nombre":"Óscar","penalti":true} |
| gol-014-2 | validation | Gol de penalti de Oscar para nosotros | {"evento":"gol","equipo":"equipo1","nombre":"Oscar","penalti":true} |
| gol-014-3 | validation | Óscar convirtió desde los siete metros para nosotros. | {"evento":"gol","equipo":"equipo1","nombre":"Óscar","penalti":true} |
| gol-015-1 | train | Gol del club La Jota. | {"evento":"gol","equipo":"equipo2"} |
| gol-015-2 | train | Gol del club La Jota | {"evento":"gol","equipo":"equipo2"} |
| gol-015-3 | train | La Jota acaba de sumar un gol. | {"evento":"gol","equipo":"equipo2"} |
| parada-001-1 | train | Parada de nuestro portero. | {"evento":"parada","equipo":"equipo1"} |
| parada-001-2 | train | Parada de nuestro portero | {"evento":"parada","equipo":"equipo1"} |
| parada-001-3 | train | Nuestro portero acaba de evitar el tanto con una parada. | {"evento":"parada","equipo":"equipo1"} |
| parada-002-1 | train | Sara, dorsal 10, para el lanzamiento de ellos. | {"evento":"parada","equipo":"equipo1","nombre":"Sara","dorsal":10} |
| parada-002-2 | train | Sara dorsal diez para el lanzamiento de ellos | {"evento":"parada","equipo":"equipo1","nombre":"Sara","dorsal":10} |
| parada-002-3 | train | Nuestra portera Sara, dorsal diez, detuvo el tiro de ellas. | {"evento":"parada","equipo":"equipo1","nombre":"Sara","dorsal":10} |
| parada-003-1 | train | Parada de Elena al tiro de Paula. | {"evento":"parada","equipo":"desconocido","nombre":"Elena","nombre_relacionado":"Paula"} |
| parada-003-2 | train | Parada de Elena al tiro de Paula | {"evento":"parada","equipo":"desconocido","nombre":"Elena","nombre_relacionado":"Paula"} |
| parada-003-3 | train | Paula lanzó y Elena se lo paró. | {"evento":"parada","equipo":"desconocido","nombre":"Elena","nombre_relacionado":"Paula"} |
| parada-004-1 | train | Parada de ellos ante lanzamiento del dorsal 11. | {"evento":"parada","equipo":"equipo2","dorsal_relacionado":11} |
| parada-004-2 | train | Parada de ellos ante lanzamiento del dorsal once | {"evento":"parada","equipo":"equipo2","dorsal_relacionado":11} |
| parada-004-3 | train | El portero rival atajó el tiro del jugador que lleva el once. | {"evento":"parada","equipo":"equipo2","dorsal_relacionado":11} |
| parada-005-1 | train | El portero rival detiene el tiro de Julia. | {"evento":"parada","equipo":"equipo2","nombre_relacionado":"Julia"} |
| parada-005-2 | train | El portero rival detiene el tiro de Julia | {"evento":"parada","equipo":"equipo2","nombre_relacionado":"Julia"} |
| parada-005-3 | train | El tiro de Julia lo detuvo el portero contrario. | {"evento":"parada","equipo":"equipo2","nombre_relacionado":"Julia"} |
| parada-006-1 | validation | Parada de dorsal 12 para nosotros. | {"evento":"parada","equipo":"equipo1","dorsal":12} |
| parada-006-2 | validation | Parada de dorsal doce para nosotros | {"evento":"parada","equipo":"equipo1","dorsal":12} |
| parada-006-3 | validation | Nuestro dorsal doce se quedó con el lanzamiento. | {"evento":"parada","equipo":"equipo1","dorsal":12} |
| parada-007-1 | validation | El dorsal 16 rival para el lanzamiento. | {"evento":"parada","equipo":"equipo2","dorsal":16} |
| parada-007-2 | validation | El dorsal dieciseis rival para el lanzamiento | {"evento":"parada","equipo":"equipo2","dorsal":16} |
| parada-007-3 | validation | El lanzamiento acabó en las manos del portero rival, dorsal dieciséis. | {"evento":"parada","equipo":"equipo2","dorsal":16} |
| parada-008-1 | train | Parada de nuestro dorsal 17. | {"evento":"parada","equipo":"equipo1","dorsal":17} |
| parada-008-2 | train | Parada de nuestro dorsal diecisiete | {"evento":"parada","equipo":"equipo1","dorsal":17} |
| parada-008-3 | train | La parada fue de nuestro número diecisiete. | {"evento":"parada","equipo":"equipo1","dorsal":17} |
| parada-009-1 | test | Parada del dorsal 21. | {"evento":"parada","equipo":"desconocido","dorsal":21} |
| parada-009-2 | test | Parada del dorsal veintiuno | {"evento":"parada","equipo":"desconocido","dorsal":21} |
| parada-009-3 | test | El dorsal veintiuno firmó una parada. | {"evento":"parada","equipo":"desconocido","dorsal":21} |
| parada-010-1 | train | Hugo, dorsal 22, detiene el tiro de ellos. | {"evento":"parada","equipo":"equipo1","nombre":"Hugo","dorsal":22} |
| parada-010-2 | train | eh Hugo dorsal veintidos detiene el tiro de ellos vale | {"evento":"parada","equipo":"equipo1","nombre":"Hugo","dorsal":22} |
| parada-010-3 | train | Hugo, que lleva el veintidós, le negó el gol a ellos. | {"evento":"parada","equipo":"equipo1","nombre":"Hugo","dorsal":22} |
| parada-011-1 | train | Parada de Raúl, dorsal 12, ante el lanzamiento de Miguel Ángel, dorsal 23. | {"evento":"parada","equipo":"desconocido","nombre":"Raúl","nombre_relacionado":"Miguel Ángel","dorsal_relacionado":23,"dorsal":12} |
| parada-011-2 | train | Parada de Raul dorsal doce ante el lanzamiento de Miguel Angel dorsal veintitres | {"evento":"parada","equipo":"desconocido","nombre":"Raul","nombre_relacionado":"Miguel Angel","dorsal_relacionado":23,"dorsal":12} |
| parada-011-3 | train | Miguel Ángel, dorsal veintitrés, lanzó y Raúl, dorsal 12, hizo la parada. | {"evento":"parada","equipo":"desconocido","nombre":"Raúl","nombre_relacionado":"Miguel Ángel","dorsal_relacionado":23,"dorsal":12} |
| parada-012-1 | train | Íñigo, su portero, para nuestro lanzamiento. | {"evento":"parada","equipo":"equipo2","nombre":"Íñigo"} |
| parada-012-2 | train | Inigo su portero para nuestro lanzamiento | {"evento":"parada","equipo":"equipo2","nombre":"Inigo"} |
| parada-012-3 | train | Íñigo, el guardameta de ellos, bloqueó nuestro tiro. | {"evento":"parada","equipo":"equipo2","nombre":"Íñigo"} |
| parada-013-1 | train | Parada del portero de ellos ante el tiro de José Luis. | {"evento":"parada","equipo":"equipo2","nombre_relacionado":"José Luis"} |
| parada-013-2 | train | Parada del portero de ellos ante el tiro de Jose Luis | {"evento":"parada","equipo":"equipo2","nombre_relacionado":"Jose Luis"} |
| parada-013-3 | train | José Luis lanzó contra ellos y su portero lo detuvo. | {"evento":"parada","equipo":"equipo2","nombre_relacionado":"José Luis"} |
| parada-014-1 | test | Sergio ataja un penalti de ellos. | {"evento":"parada","equipo":"equipo1","nombre":"Sergio","penalti":true} |
| parada-014-2 | test | Sergio ataja un penalti de ellos | {"evento":"parada","equipo":"equipo1","nombre":"Sergio","penalti":true} |
| parada-014-3 | test | Sergio detuvo el lanzamiento de penalti de ellos. | {"evento":"parada","equipo":"equipo1","nombre":"Sergio","penalti":true} |
| parada-015-1 | train | El portero del club Águilas para un penalti de siete metros. | {"evento":"parada","equipo":"equipo1","penalti":true} |
| parada-015-2 | train | El portero del club Aguilas para un penalti de siete metros | {"evento":"parada","equipo":"equipo1","penalti":true} |
| parada-015-3 | train | Águilas detuvo el lanzamiento de siete metros. | {"evento":"parada","equipo":"equipo1","penalti":true} |
| fallo-001-1 | train | Fallo de nuestro lanzamiento. | {"evento":"fallo","equipo":"equipo1"} |
| fallo-001-2 | train | Fallo de nuestro lanzamiento | {"evento":"fallo","equipo":"equipo1"} |
| fallo-001-3 | train | Nuestro lanzamiento se ha ido fuera. | {"evento":"fallo","equipo":"equipo1"} |
| fallo-002-1 | validation | Marta, dorsal 26, tira fuera para nosotros. | {"evento":"fallo","equipo":"equipo1","nombre":"Marta","dorsal":26} |
| fallo-002-2 | validation | Marta dorsal veintiseis tira fuera para nosotros | {"evento":"fallo","equipo":"equipo1","nombre":"Marta","dorsal":26} |
| fallo-002-3 | validation | El tiro de Marta, dorsal veintiséis, se marchó fuera para nosotros. | {"evento":"fallo","equipo":"equipo1","nombre":"Marta","dorsal":26} |
| fallo-003-1 | train | Lucía falla el tiro. | {"evento":"fallo","equipo":"desconocido","nombre":"Lucía"} |
| fallo-003-2 | train | Lucia falla el tiro | {"evento":"fallo","equipo":"desconocido","nombre":"Lucia"} |
| fallo-003-3 | train | Lucía no consiguió acertar a portería. | {"evento":"fallo","equipo":"desconocido","nombre":"Lucía"} |
| fallo-004-1 | train | Carmen tira fuera para ellos. | {"evento":"fallo","equipo":"equipo2","nombre":"Carmen"} |
| fallo-004-2 | train | Carmen tira fuera para ellos | {"evento":"fallo","equipo":"equipo2","nombre":"Carmen"} |
| fallo-004-3 | train | Carmen no encontró portería para ellos. | {"evento":"fallo","equipo":"equipo2","nombre":"Carmen"} |
| fallo-005-1 | train | Ana, del equipo rival, falla el tiro. | {"evento":"fallo","equipo":"equipo2","nombre":"Ana"} |
| fallo-005-2 | train | Ana del equipo rival falla el tiro | {"evento":"fallo","equipo":"equipo2","nombre":"Ana"} |
| fallo-005-3 | train | Ana, que juega en el rival, mandó el tiro fuera. | {"evento":"fallo","equipo":"equipo2","nombre":"Ana"} |
| fallo-006-1 | validation | Fallo de dorsal 30 nuestro. | {"evento":"fallo","equipo":"equipo1","dorsal":30} |
| fallo-006-2 | validation | Fallo de dorsal treinta nuestro | {"evento":"fallo","equipo":"equipo1","dorsal":30} |
| fallo-006-3 | validation | El dorsal treinta de los nuestros no acertó el lanzamiento. | {"evento":"fallo","equipo":"equipo1","dorsal":30} |
| fallo-007-1 | test | El dorsal 33 de ellos tira fuera. | {"evento":"fallo","equipo":"equipo2","dorsal":33} |
| fallo-007-2 | test | El dorsal treinta y tres de ellos tira fuera | {"evento":"fallo","equipo":"equipo2","dorsal":33} |
| fallo-007-3 | test | El tiro del treinta y tres rival se fue fuera. | {"evento":"fallo","equipo":"equipo2","dorsal":33} |
| fallo-008-1 | train | Falla el dorsal 40. | {"evento":"fallo","equipo":"desconocido","dorsal":40} |
| fallo-008-2 | train | Falla el dorsal cuarenta | {"evento":"fallo","equipo":"desconocido","dorsal":40} |
| fallo-008-3 | train | El lanzamiento del dorsal cuarenta acabó desviado. | {"evento":"fallo","equipo":"desconocido","dorsal":40} |
| fallo-009-1 | train | Lanzamiento fallado por el dorsal 55 rival. | {"evento":"fallo","equipo":"equipo2","dorsal":55} |
| fallo-009-2 | train | Lanzamiento fallado por el dorsal cincuenta y cinco rival | {"evento":"fallo","equipo":"equipo2","dorsal":55} |
| fallo-009-3 | train | El cincuenta y cinco del rival marró su tiro. | {"evento":"fallo","equipo":"equipo2","dorsal":55} |
| fallo-010-1 | test | Álvaro, dorsal 60, lanza fuera para nosotros. | {"evento":"fallo","equipo":"equipo1","nombre":"Álvaro","dorsal":60} |
| fallo-010-2 | test | Alvaro dorsal sesenta lanza fuera para nosotros | {"evento":"fallo","equipo":"equipo1","nombre":"Alvaro","dorsal":60} |
| fallo-010-3 | test | Álvaro, con el sesenta, lanzó fuera de portería para nosotros. | {"evento":"fallo","equipo":"equipo1","nombre":"Álvaro","dorsal":60} |
| fallo-011-1 | train | Jesús lanza al poste y no marca. | {"evento":"fallo","equipo":"desconocido","nombre":"Jesús"} |
| fallo-011-2 | train | Jesus lanza al poste y no marca | {"evento":"fallo","equipo":"desconocido","nombre":"Jesus"} |
| fallo-011-3 | train | Jesús estrelló el lanzamiento en el poste y no marcó. | {"evento":"fallo","equipo":"desconocido","nombre":"Jesús"} |
| fallo-012-1 | train | Daniel no encuentra portería para ellos. | {"evento":"fallo","equipo":"equipo2","nombre":"Daniel"} |
| fallo-012-2 | train | Daniel no encuentra porteria para ellos | {"evento":"fallo","equipo":"equipo2","nombre":"Daniel"} |
| fallo-012-3 | train | Daniel erró el tiro de ellos. | {"evento":"fallo","equipo":"equipo2","nombre":"Daniel"} |
| fallo-013-1 | train | Álvaro falla para ellos. | {"evento":"fallo","equipo":"equipo2","nombre":"Álvaro"} |
| fallo-013-2 | train | Alvaro falla para ellos | {"evento":"fallo","equipo":"equipo2","nombre":"Alvaro"} |
| fallo-013-3 | train | Álvaro no convirtió para el equipo contrario. | {"evento":"fallo","equipo":"equipo2","nombre":"Álvaro"} |
| fallo-014-1 | train | José falla un penalti nuestro. | {"evento":"fallo","equipo":"equipo1","nombre":"José","penalti":true} |
| fallo-014-2 | train | Jose falla un penalti nuestro | {"evento":"fallo","equipo":"equipo1","nombre":"Jose","penalti":true} |
| fallo-014-3 | train | José no transformó el penalti de nuestro lado. | {"evento":"fallo","equipo":"equipo1","nombre":"José","penalti":true} |
| fallo-015-1 | train | El equipo Bidasoa falla un siete metros. | {"evento":"fallo","equipo":"equipo2","penalti":true} |
| fallo-015-2 | train | El equipo Bidasoa falla un siete metros | {"evento":"fallo","equipo":"equipo2","penalti":true} |
| fallo-015-3 | train | Bidasoa lanzó desde los siete metros y no anotó. | {"evento":"fallo","equipo":"equipo2","penalti":true} |
| perdida-001-1 | train | Pérdida nuestra. | {"evento":"perdida","equipo":"equipo1"} |
| perdida-001-2 | train | Perdida nuestra | {"evento":"perdida","equipo":"equipo1"} |
| perdida-001-3 | train | Se nos escapó la posesión. | {"evento":"perdida","equipo":"equipo1"} |
| perdida-002-1 | train | Celia, dorsal 66, pierde el balón para nosotros. | {"evento":"perdida","equipo":"equipo1","nombre":"Celia","dorsal":66} |
| perdida-002-2 | train | Celia dorsal sesenta y seis pierde el balon para nosotros | {"evento":"perdida","equipo":"equipo1","nombre":"Celia","dorsal":66} |
| perdida-002-3 | train | Celia, dorsal sesenta y seis, perdió el balón que teníamos nosotras. | {"evento":"perdida","equipo":"equipo1","nombre":"Celia","dorsal":66} |
| perdida-003-1 | validation | Pérdida de Clara. | {"evento":"perdida","equipo":"desconocido","nombre":"Clara"} |
| perdida-003-2 | validation | Perdida de Clara | {"evento":"perdida","equipo":"desconocido","nombre":"Clara"} |
| perdida-003-3 | validation | Clara fue quien perdió la pelota. | {"evento":"perdida","equipo":"desconocido","nombre":"Clara"} |
| perdida-004-1 | train | Rocío pierde para ellos. | {"evento":"perdida","equipo":"equipo2","nombre":"Rocío"} |
| perdida-004-2 | train | Rocio pierde para ellos | {"evento":"perdida","equipo":"equipo2","nombre":"Rocio"} |
| perdida-004-3 | train | La rival Rocío dejó escapar la pelota y perdió la posesión. | {"evento":"perdida","equipo":"equipo2","nombre":"Rocío"} |
| perdida-005-1 | train | Nuria regala el balón al rival. | {"evento":"perdida","equipo":"equipo1","nombre":"Nuria"} |
| perdida-005-2 | train | Nuria regala el balon al rival | {"evento":"perdida","equipo":"equipo1","nombre":"Nuria"} |
| perdida-005-3 | train | Nuria cometió la pérdida y el rival se quedó con el balón. | {"evento":"perdida","equipo":"equipo1","nombre":"Nuria"} |
| perdida-006-1 | train | Pérdida del dorsal 70 de nuestro equipo. | {"evento":"perdida","equipo":"equipo1","dorsal":70} |
| perdida-006-2 | train | Perdida del dorsal setenta de nuestro equipo | {"evento":"perdida","equipo":"equipo1","dorsal":70} |
| perdida-006-3 | train | El balón lo perdió nuestro dorsal setenta. | {"evento":"perdida","equipo":"equipo1","dorsal":70} |
| perdida-007-1 | validation | El dorsal 77 de ellos pierde el balón. | {"evento":"perdida","equipo":"equipo2","dorsal":77} |
| perdida-007-2 | validation | El dorsal setenta y siete de ellos pierde el balon | {"evento":"perdida","equipo":"equipo2","dorsal":77} |
| perdida-007-3 | validation | El setenta y siete de ellos cedió la pelota. | {"evento":"perdida","equipo":"equipo2","dorsal":77} |
| perdida-008-1 | train | Pérdida del dorsal 80. | {"evento":"perdida","equipo":"desconocido","dorsal":80} |
| perdida-008-2 | train | Perdida del dorsal ochenta | {"evento":"perdida","equipo":"desconocido","dorsal":80} |
| perdida-008-3 | train | La pérdida fue del dorsal ochenta. | {"evento":"perdida","equipo":"desconocido","dorsal":80} |
| perdida-009-1 | train | Pérdida de dorsal 88 rival. | {"evento":"perdida","equipo":"equipo2","dorsal":88} |
| perdida-009-2 | train | Perdida de dorsal ochenta y ocho rival | {"evento":"perdida","equipo":"equipo2","dorsal":88} |
| perdida-009-3 | train | El dorsal ochenta y ocho rival dejó escapar el balón. | {"evento":"perdida","equipo":"equipo2","dorsal":88} |
| perdida-010-1 | train | Javier, dorsal 90, pierde la pelota para nosotros. | {"evento":"perdida","equipo":"equipo1","nombre":"Javier","dorsal":90} |
| perdida-010-2 | train | Javier dorsal noventa pierde la pelota para nosotros | {"evento":"perdida","equipo":"equipo1","nombre":"Javier","dorsal":90} |
| perdida-010-3 | train | Javier, dorsal noventa, perdió la posesión de los nuestros. | {"evento":"perdida","equipo":"equipo1","nombre":"Javier","dorsal":90} |
| perdida-011-1 | test | Pablo pierde el balón. | {"evento":"perdida","equipo":"desconocido","nombre":"Pablo"} |
| perdida-011-2 | test | Pablo pierde el balon | {"evento":"perdida","equipo":"desconocido","nombre":"Pablo"} |
| perdida-011-3 | test | Pablo dejó ir la pelota. | {"evento":"perdida","equipo":"desconocido","nombre":"Pablo"} |
| perdida-012-1 | train | Diego comete pérdida para ellos. | {"evento":"perdida","equipo":"equipo2","nombre":"Diego"} |
| perdida-012-2 | train | Diego comete perdida para ellos | {"evento":"perdida","equipo":"equipo2","nombre":"Diego"} |
| perdida-012-3 | train | Diego, jugador rival, entregó mal y perdió el balón. | {"evento":"perdida","equipo":"equipo2","nombre":"Diego"} |
| perdida-013-1 | train | Javier pierde para ellos. | {"evento":"perdida","equipo":"equipo2","nombre":"Javier"} |
| perdida-013-2 | train | Javier pierde para ellos | {"evento":"perdida","equipo":"equipo2","nombre":"Javier"} |
| perdida-013-3 | train | Javier perdió la pelota para el rival. | {"evento":"perdida","equipo":"equipo2","nombre":"Javier"} |
| perdida-014-1 | test | Ángel pierde la posesión para nosotros. | {"evento":"perdida","equipo":"equipo1","nombre":"Ángel"} |
| perdida-014-2 | test | Angel pierde la posesion para nosotros | {"evento":"perdida","equipo":"equipo1","nombre":"Angel"} |
| perdida-014-3 | test | Ángel perdió el balón que controlábamos nosotros. | {"evento":"perdida","equipo":"equipo1","nombre":"Ángel"} |
| perdida-015-1 | train | Pérdida del equipo Marineras. | {"evento":"perdida","equipo":"equipo1"} |
| perdida-015-2 | train | Perdida del equipo Marineras | {"evento":"perdida","equipo":"equipo1"} |
| perdida-015-3 | train | Marineras perdió el balón. | {"evento":"perdida","equipo":"equipo1"} |
| recuperacion-001-1 | train | Recuperación nuestra. | {"evento":"recuperacion","equipo":"equipo1"} |
| recuperacion-001-2 | train | Recuperacion nuestra | {"evento":"recuperacion","equipo":"equipo1"} |
| recuperacion-001-3 | train | La posesión vuelve a los nuestros tras una recuperación. | {"evento":"recuperacion","equipo":"equipo1"} |
| recuperacion-002-1 | test | Alicia, dorsal 99, recupera para nosotros. | {"evento":"recuperacion","equipo":"equipo1","nombre":"Alicia","dorsal":99} |
| recuperacion-002-2 | test | Alicia dorsal noventa y nueve recupera para nosotros | {"evento":"recuperacion","equipo":"equipo1","nombre":"Alicia","dorsal":99} |
| recuperacion-002-3 | test | Alicia, con el noventa y nueve, recuperó el balón para nosotros. | {"evento":"recuperacion","equipo":"equipo1","nombre":"Alicia","dorsal":99} |
| recuperacion-003-1 | train | Beatriz roba el balón a Irene. | {"evento":"recuperacion","equipo":"desconocido","nombre":"Beatriz","nombre_relacionado":"Irene"} |
| recuperacion-003-2 | train | Beatriz roba el balon a Irene | {"evento":"recuperacion","equipo":"desconocido","nombre":"Beatriz","nombre_relacionado":"Irene"} |
| recuperacion-003-3 | train | Irene perdió la pelota ante Beatriz, que la recuperó. | {"evento":"recuperacion","equipo":"desconocido","nombre":"Beatriz","nombre_relacionado":"Irene"} |
| recuperacion-004-1 | train | Recupera Teresa para ellos. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Teresa"} |
| recuperacion-004-2 | train | Recupera Teresa para ellos | {"evento":"recuperacion","equipo":"equipo2","nombre":"Teresa"} |
| recuperacion-004-3 | train | Teresa interceptó el pase y recuperó la pelota para ellas. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Teresa"} |
| recuperacion-005-1 | validation | Isabel recupera para el rival. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Isabel"} |
| recuperacion-005-2 | validation | Isabel recupera para el rival | {"evento":"recuperacion","equipo":"equipo2","nombre":"Isabel"} |
| recuperacion-005-3 | validation | El balón lo recuperó Isabel para el rival. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Isabel"} |
| recuperacion-006-1 | validation | Recuperación de dorsal 0 nuestro. | {"evento":"recuperacion","equipo":"equipo1","dorsal":0} |
| recuperacion-006-2 | validation | Recuperacion de dorsal cero nuestro | {"evento":"recuperacion","equipo":"equipo1","dorsal":0} |
| recuperacion-006-3 | validation | Nuestro dorsal cero ganó la posesión. | {"evento":"recuperacion","equipo":"equipo1","dorsal":0} |
| recuperacion-007-1 | train | El dorsal 6 de ellos recupera. | {"evento":"recuperacion","equipo":"equipo2","dorsal":6} |
| recuperacion-007-2 | train | El dorsal seis de ellos recupera | {"evento":"recuperacion","equipo":"equipo2","dorsal":6} |
| recuperacion-007-3 | train | El equipo rival recuperó el balón con su dorsal seis. | {"evento":"recuperacion","equipo":"equipo2","dorsal":6} |
| recuperacion-008-1 | train | Recuperación del dorsal 7. | {"evento":"recuperacion","equipo":"desconocido","dorsal":7} |
| recuperacion-008-2 | train | Recuperacion del dorsal siete | {"evento":"recuperacion","equipo":"desconocido","dorsal":7} |
| recuperacion-008-3 | train | El dorsal siete se hizo con la pelota. | {"evento":"recuperacion","equipo":"desconocido","dorsal":7} |
| recuperacion-009-1 | train | Dorsal 9 rival recupera la pelota. | {"evento":"recuperacion","equipo":"equipo2","dorsal":9} |
| recuperacion-009-2 | train | Dorsal nueve rival recupera la pelota | {"evento":"recuperacion","equipo":"equipo2","dorsal":9} |
| recuperacion-009-3 | train | El número nueve rival recuperó la posesión. | {"evento":"recuperacion","equipo":"equipo2","dorsal":9} |
| recuperacion-010-1 | train | Pedro, dorsal 10, recupera para nosotros. | {"evento":"recuperacion","equipo":"equipo1","nombre":"Pedro","dorsal":10} |
| recuperacion-010-2 | train | eh Pedro dorsal diez recupera para nosotros vale | {"evento":"recuperacion","equipo":"equipo1","nombre":"Pedro","dorsal":10} |
| recuperacion-010-3 | train | Pedro, dorsal diez, robó el balón para los nuestros. | {"evento":"recuperacion","equipo":"equipo1","nombre":"Pedro","dorsal":10} |
| recuperacion-011-1 | train | Antonio, dorsal 8, recupera el balón de Sergio, dorsal 11. | {"evento":"recuperacion","equipo":"desconocido","nombre":"Antonio","nombre_relacionado":"Sergio","dorsal_relacionado":11,"dorsal":8} |
| recuperacion-011-2 | train | Antonio dorsal ocho recupera el balon de Sergio dorsal once | {"evento":"recuperacion","equipo":"desconocido","nombre":"Antonio","nombre_relacionado":"Sergio","dorsal_relacionado":11,"dorsal":8} |
| recuperacion-011-3 | train | Sergio, el once, perdió la pelota ante Antonio, dorsal 8, que la recuperó. | {"evento":"recuperacion","equipo":"desconocido","nombre":"Antonio","nombre_relacionado":"Sergio","dorsal_relacionado":11,"dorsal":8} |
| recuperacion-012-1 | train | Marcos roba para ellos. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Marcos"} |
| recuperacion-012-2 | train | Marcos roba para ellos | {"evento":"recuperacion","equipo":"equipo2","nombre":"Marcos"} |
| recuperacion-012-3 | train | Marcos consiguió recuperar el balón para ellos. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Marcos"} |
| recuperacion-013-1 | train | Pedro recupera para ellos. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Pedro"} |
| recuperacion-013-2 | train | Pedro recupera para ellos | {"evento":"recuperacion","equipo":"equipo2","nombre":"Pedro"} |
| recuperacion-013-3 | train | Pedro recuperó para el equipo contrario. | {"evento":"recuperacion","equipo":"equipo2","nombre":"Pedro"} |
| recuperacion-014-1 | test | Rubén recupera para los nuestros. | {"evento":"recuperacion","equipo":"equipo1","nombre":"Rubén"} |
| recuperacion-014-2 | test | Ruben recupera para los nuestros | {"evento":"recuperacion","equipo":"equipo1","nombre":"Ruben"} |
| recuperacion-014-3 | test | Rubén recuperó la pelota para nuestro equipo. | {"evento":"recuperacion","equipo":"equipo1","nombre":"Rubén"} |
| recuperacion-015-1 | train | Recuperación del club Río Verde. | {"evento":"recuperacion","equipo":"equipo2"} |
| recuperacion-015-2 | train | Recuperacion del club Rio Verde | {"evento":"recuperacion","equipo":"equipo2"} |
| recuperacion-015-3 | train | Río Verde recuperó el balón. | {"evento":"recuperacion","equipo":"equipo2"} |
| penalti_cometido-001-1 | train | Penalti cometido por nosotros. | {"evento":"penalti_cometido","equipo":"equipo1"} |
| penalti_cometido-001-2 | train | Penalti cometido por nosotros | {"evento":"penalti_cometido","equipo":"equipo1"} |
| penalti_cometido-001-3 | train | Se ha señalado penalti contra nuestro equipo. | {"evento":"penalti_cometido","equipo":"equipo1"} |
| penalti_cometido-002-1 | train | Sandra, dorsal 12, comete penalti contra ellos. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Sandra","dorsal":12} |
| penalti_cometido-002-2 | train | Sandra dorsal doce comete penalti contra ellos | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Sandra","dorsal":12} |
| penalti_cometido-002-3 | train | Nos han pitado penalti en contra por una falta de Sandra, dorsal doce. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Sandra","dorsal":12} |
| penalti_cometido-003-1 | train | Silvia hace penalti a Noelia. | {"evento":"penalti_cometido","equipo":"desconocido","nombre":"Silvia","nombre_relacionado":"Noelia"} |
| penalti_cometido-003-2 | train | Silvia hace penalti a Noelia | {"evento":"penalti_cometido","equipo":"desconocido","nombre":"Silvia","nombre_relacionado":"Noelia"} |
| penalti_cometido-003-3 | train | Silvia cometió penalti sobre Noelia. | {"evento":"penalti_cometido","equipo":"desconocido","nombre":"Silvia","nombre_relacionado":"Noelia"} |
| penalti_cometido-004-1 | train | Penalti cometido por ellos. | {"evento":"penalti_cometido","equipo":"equipo2"} |
| penalti_cometido-004-2 | train | Penalti cometido por ellos | {"evento":"penalti_cometido","equipo":"equipo2"} |
| penalti_cometido-004-3 | train | La falta que cometió el equipo rival fue sancionada con penalti. | {"evento":"penalti_cometido","equipo":"equipo2"} |
| penalti_cometido-005-1 | test | Elena Ruiz hace penalti a favor del rival. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Elena Ruiz"} |
| penalti_cometido-005-2 | test | Elena Ruiz hace penalti a favor del rival | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Elena Ruiz"} |
| penalti_cometido-005-3 | test | Por una falta de Elena Ruiz nos han señalado penalti en contra. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Elena Ruiz"} |
| penalti_cometido-006-1 | train | El dorsal 16 nuestro comete penalti. | {"evento":"penalti_cometido","equipo":"equipo1","dorsal":16} |
| penalti_cometido-006-2 | train | El dorsal dieciseis nuestro comete penalti | {"evento":"penalti_cometido","equipo":"equipo1","dorsal":16} |
| penalti_cometido-006-3 | train | Nuestro dorsal dieciséis cometió una falta de penalti. | {"evento":"penalti_cometido","equipo":"equipo1","dorsal":16} |
| penalti_cometido-007-1 | train | El dorsal 17 de ellos comete penalti. | {"evento":"penalti_cometido","equipo":"equipo2","dorsal":17} |
| penalti_cometido-007-2 | train | El dorsal diecisiete de ellos comete penalti | {"evento":"penalti_cometido","equipo":"equipo2","dorsal":17} |
| penalti_cometido-007-3 | train | El diecisiete de ellos hizo penalti. | {"evento":"penalti_cometido","equipo":"equipo2","dorsal":17} |
| penalti_cometido-008-1 | train | Penalti cometido por el dorsal 21. | {"evento":"penalti_cometido","equipo":"desconocido","dorsal":21} |
| penalti_cometido-008-2 | train | Penalti cometido por el dorsal veintiuno | {"evento":"penalti_cometido","equipo":"desconocido","dorsal":21} |
| penalti_cometido-008-3 | train | Se pitó penalti al jugador del dorsal veintiuno. | {"evento":"penalti_cometido","equipo":"desconocido","dorsal":21} |
| penalti_cometido-009-1 | validation | Dorsal 22 rival comete penalti sobre nosotros. | {"evento":"penalti_cometido","equipo":"equipo2","dorsal":22} |
| penalti_cometido-009-2 | validation | Dorsal veintidos rival comete penalti sobre nosotros | {"evento":"penalti_cometido","equipo":"equipo2","dorsal":22} |
| penalti_cometido-009-3 | validation | El dorsal veintidós rival cometió penalti sobre nosotros. | {"evento":"penalti_cometido","equipo":"equipo2","dorsal":22} |
| penalti_cometido-010-1 | train | Jorge, dorsal 23, comete penalti contra nosotros. | {"evento":"penalti_cometido","equipo":"equipo2","nombre":"Jorge","dorsal":23} |
| penalti_cometido-010-2 | train | Jorge dorsal veintitres comete penalti contra nosotros | {"evento":"penalti_cometido","equipo":"equipo2","nombre":"Jorge","dorsal":23} |
| penalti_cometido-010-3 | train | Jorge, con el veintitrés, hizo penalti contra nosotros. | {"evento":"penalti_cometido","equipo":"equipo2","nombre":"Jorge","dorsal":23} |
| penalti_cometido-011-1 | train | Eduardo, dorsal 17, comete penalti sobre Héctor, dorsal 26. | {"evento":"penalti_cometido","equipo":"desconocido","nombre":"Eduardo","nombre_relacionado":"Héctor","dorsal_relacionado":26,"dorsal":17} |
| penalti_cometido-011-2 | train | Eduardo dorsal diecisiete comete penalti sobre Hector dorsal veintiseis | {"evento":"penalti_cometido","equipo":"desconocido","nombre":"Eduardo","nombre_relacionado":"Hector","dorsal_relacionado":26,"dorsal":17} |
| penalti_cometido-011-3 | train | Eduardo, dorsal 17, cometió penalti sobre Héctor, que lleva el veintiséis. | {"evento":"penalti_cometido","equipo":"desconocido","nombre":"Eduardo","nombre_relacionado":"Héctor","dorsal_relacionado":26,"dorsal":17} |
| penalti_cometido-012-1 | test | David comete penalti contra ellos. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"David"} |
| penalti_cometido-012-2 | test | David comete penalti contra ellos | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"David"} |
| penalti_cometido-012-3 | test | David le hizo penalti al equipo contrario. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"David"} |
| penalti_cometido-013-1 | train | Jorge hace penalti para el rival. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Jorge"} |
| penalti_cometido-013-2 | train | Jorge hace penalti para el rival | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Jorge"} |
| penalti_cometido-013-3 | train | Jorge cometió la infracción que dio penalti al rival. | {"evento":"penalti_cometido","equipo":"equipo1","nombre":"Jorge"} |
| penalti_cometido-014-1 | validation | Ramón comete penalti sobre los nuestros. | {"evento":"penalti_cometido","equipo":"equipo2","nombre":"Ramón"} |
| penalti_cometido-014-2 | validation | Ramon comete penalti sobre los nuestros | {"evento":"penalti_cometido","equipo":"equipo2","nombre":"Ramon"} |
| penalti_cometido-014-3 | validation | Ramón cometió penalti sobre un jugador de los nuestros. | {"evento":"penalti_cometido","equipo":"equipo2","nombre":"Ramón"} |
| penalti_cometido-015-1 | train | Penalti cometido por el club Tiburones. | {"evento":"penalti_cometido","equipo":"equipo1"} |
| penalti_cometido-015-2 | train | Penalti cometido por el club Tiburones | {"evento":"penalti_cometido","equipo":"equipo1"} |
| penalti_cometido-015-3 | train | Tiburones cometió penalti. | {"evento":"penalti_cometido","equipo":"equipo1"} |
| exclusion-001-1 | train | Exclusión para nuestro equipo. | {"evento":"exclusion","equipo":"equipo1"} |
| exclusion-001-2 | train | Exclusion para nuestro equipo | {"evento":"exclusion","equipo":"equipo1"} |
| exclusion-001-3 | train | Han excluido a una de nosotras. | {"evento":"exclusion","equipo":"equipo1"} |
| exclusion-002-1 | train | Ana, dorsal 30, queda excluida dos minutos. | {"evento":"exclusion","equipo":"desconocido","nombre":"Ana","dorsal":30} |
| exclusion-002-2 | train | Ana dorsal treinta queda excluida dos minutos | {"evento":"exclusion","equipo":"desconocido","nombre":"Ana","dorsal":30} |
| exclusion-002-3 | train | Ana, con el treinta, se queda dos minutos fuera. | {"evento":"exclusion","equipo":"desconocido","nombre":"Ana","dorsal":30} |
| exclusion-003-1 | train | Exclusión de María, provocada por Carmen. | {"evento":"exclusion","equipo":"desconocido","nombre":"María","nombre_relacionado":"Carmen"} |
| exclusion-003-2 | train | Exclusion de Maria provocada por Carmen | {"evento":"exclusion","equipo":"desconocido","nombre":"Maria","nombre_relacionado":"Carmen"} |
| exclusion-003-3 | train | Carmen provocó la exclusión de María. | {"evento":"exclusion","equipo":"desconocido","nombre":"María","nombre_relacionado":"Carmen"} |
| exclusion-004-1 | validation | Exclusión para ellos. | {"evento":"exclusion","equipo":"equipo2"} |
| exclusion-004-2 | validation | Exclusion para ellos | {"evento":"exclusion","equipo":"equipo2"} |
| exclusion-004-3 | validation | El equipo rival se queda con una exclusión. | {"evento":"exclusion","equipo":"equipo2"} |
| exclusion-005-1 | train | A Lucía, del rival, la excluyen dos minutos. | {"evento":"exclusion","equipo":"equipo2","nombre":"Lucía"} |
| exclusion-005-2 | train | A Lucia del rival la excluyen dos minutos | {"evento":"exclusion","equipo":"equipo2","nombre":"Lucia"} |
| exclusion-005-3 | train | La rival Lucía debe cumplir una exclusión de dos minutos. | {"evento":"exclusion","equipo":"equipo2","nombre":"Lucía"} |
| exclusion-006-1 | train | Excluido dorsal 33 nuestro, dos minutos. | {"evento":"exclusion","equipo":"equipo1","dorsal":33} |
| exclusion-006-2 | train | eh Excluido dorsal treinta y tres nuestro dos minutos vale | {"evento":"exclusion","equipo":"equipo1","dorsal":33} |
| exclusion-006-3 | train | Dos minutos de sanción para nuestro treinta y tres. | {"evento":"exclusion","equipo":"equipo1","dorsal":33} |
| exclusion-007-1 | train | Excluyen al dorsal 40 de ellos. | {"evento":"exclusion","equipo":"equipo2","dorsal":40} |
| exclusion-007-2 | train | Excluyen al dorsal cuarenta de ellos | {"evento":"exclusion","equipo":"equipo2","dorsal":40} |
| exclusion-007-3 | train | El dorsal cuarenta de ellos se queda fuera dos minutos. | {"evento":"exclusion","equipo":"equipo2","dorsal":40} |
| exclusion-008-1 | test | Exclusión dos minutos para dorsal 55. | {"evento":"exclusion","equipo":"desconocido","dorsal":55} |
| exclusion-008-2 | test | Exclusion dos minutos para dorsal cincuenta y cinco | {"evento":"exclusion","equipo":"desconocido","dorsal":55} |
| exclusion-008-3 | test | Se ha excluido al dorsal cincuenta y cinco por dos minutos. | {"evento":"exclusion","equipo":"desconocido","dorsal":55} |
| exclusion-009-1 | train | Dorsal 60 rival excluido dos minutos. | {"evento":"exclusion","equipo":"equipo2","dorsal":60} |
| exclusion-009-2 | train | Dorsal sesenta rival excluido dos minutos | {"evento":"exclusion","equipo":"equipo2","dorsal":60} |
| exclusion-009-3 | train | El sesenta del rival cumple una exclusión de dos minutos. | {"evento":"exclusion","equipo":"equipo2","dorsal":60} |
| exclusion-010-1 | train | El rival tiene a Pablo, dorsal 66, excluido dos minutos. | {"evento":"exclusion","equipo":"equipo2","nombre":"Pablo","dorsal":66} |
| exclusion-010-2 | train | El rival tiene a Pablo dorsal sesenta y seis excluido dos minutos | {"evento":"exclusion","equipo":"equipo2","nombre":"Pablo","dorsal":66} |
| exclusion-010-3 | train | El rival deja a Pablo, dorsal sesenta y seis, excluido por dos minutos. | {"evento":"exclusion","equipo":"equipo2","nombre":"Pablo","dorsal":66} |
| exclusion-011-1 | train | Andrés, dorsal 2, excluido; la provoca Luis, dorsal 70. | {"evento":"exclusion","equipo":"desconocido","nombre":"Andrés","nombre_relacionado":"Luis","dorsal_relacionado":70,"dorsal":2} |
| exclusion-011-2 | train | Andres dorsal dos excluido la provoca Luis dorsal setenta | {"evento":"exclusion","equipo":"desconocido","nombre":"Andres","nombre_relacionado":"Luis","dorsal_relacionado":70,"dorsal":2} |
| exclusion-011-3 | train | Luis, dorsal setenta, provocó los dos minutos de exclusión de Andrés, dorsal dos. | {"evento":"exclusion","equipo":"desconocido","nombre":"Andrés","nombre_relacionado":"Luis","dorsal_relacionado":70,"dorsal":2} |
| exclusion-012-1 | validation | Diego queda excluido para ellos. | {"evento":"exclusion","equipo":"equipo2","nombre":"Diego"} |
| exclusion-012-2 | validation | Diego queda excluido para ellos | {"evento":"exclusion","equipo":"equipo2","nombre":"Diego"} |
| exclusion-012-3 | validation | El rival debe jugar dos minutos sin Diego. | {"evento":"exclusion","equipo":"equipo2","nombre":"Diego"} |
| exclusion-013-1 | test | Exclusión para Pablo, dos minutos. | {"evento":"exclusion","equipo":"desconocido","nombre":"Pablo"} |
| exclusion-013-2 | test | Exclusion para Pablo dos minutos | {"evento":"exclusion","equipo":"desconocido","nombre":"Pablo"} |
| exclusion-013-3 | test | Sancionan a Pablo con dos minutos de exclusión. | {"evento":"exclusion","equipo":"desconocido","nombre":"Pablo"} |
| exclusion-014-1 | train | Óscar, nuestro jugador, queda excluido dos minutos. | {"evento":"exclusion","equipo":"equipo1","nombre":"Óscar"} |
| exclusion-014-2 | train | Oscar nuestro jugador queda excluido dos minutos | {"evento":"exclusion","equipo":"equipo1","nombre":"Oscar"} |
| exclusion-014-3 | train | Óscar, que es nuestro, cumple dos minutos de exclusión. | {"evento":"exclusion","equipo":"equipo1","nombre":"Óscar"} |
| exclusion-015-1 | train | Dos minutos de exclusión para el club La Jota. | {"evento":"exclusion","equipo":"equipo2"} |
| exclusion-015-2 | train | Dos minutos de exclusion para el club La Jota | {"evento":"exclusion","equipo":"equipo2"} |
| exclusion-015-3 | train | La Jota tiene una sanción de dos minutos. | {"evento":"exclusion","equipo":"equipo2"} |
| amarilla-001-1 | train | Amarilla para nosotros. | {"evento":"amarilla","equipo":"equipo1"} |
| amarilla-001-2 | train | Amarilla para nosotros | {"evento":"amarilla","equipo":"equipo1"} |
| amarilla-001-3 | train | La árbitra nos mostró una amarilla. | {"evento":"amarilla","equipo":"equipo1"} |
| amarilla-002-1 | train | Sara, dorsal 77, recibe tarjeta amarilla. | {"evento":"amarilla","equipo":"desconocido","nombre":"Sara","dorsal":77} |
| amarilla-002-2 | train | Sara dorsal setenta y siete recibe tarjeta amarilla | {"evento":"amarilla","equipo":"desconocido","nombre":"Sara","dorsal":77} |
| amarilla-002-3 | train | Sara, con el setenta y siete, recibió la amonestación. | {"evento":"amarilla","equipo":"desconocido","nombre":"Sara","dorsal":77} |
| amarilla-003-1 | test | Amarilla a Elena por la árbitra. | {"evento":"amarilla","equipo":"desconocido","nombre":"Elena"} |
| amarilla-003-2 | test | Amarilla a Elena por la arbitra | {"evento":"amarilla","equipo":"desconocido","nombre":"Elena"} |
| amarilla-003-3 | test | La árbitra le enseñó una amarilla a Elena. | {"evento":"amarilla","equipo":"desconocido","nombre":"Elena"} |
| amarilla-004-1 | test | Amarilla para ellos. | {"evento":"amarilla","equipo":"equipo2"} |
| amarilla-004-2 | test | Amarilla para ellos | {"evento":"amarilla","equipo":"equipo2"} |
| amarilla-004-3 | test | Ellos recibieron tarjeta amarilla. | {"evento":"amarilla","equipo":"equipo2"} |
| amarilla-005-1 | validation | Inés, jugadora rival, recibe amarilla. | {"evento":"amarilla","equipo":"equipo2","nombre":"Inés"} |
| amarilla-005-2 | validation | Ines jugadora rival recibe amarilla | {"evento":"amarilla","equipo":"equipo2","nombre":"Ines"} |
| amarilla-005-3 | validation | La rival Inés fue amonestada. | {"evento":"amarilla","equipo":"equipo2","nombre":"Inés"} |
| amarilla-006-1 | train | Amarilla al dorsal 80 nuestro. | {"evento":"amarilla","equipo":"equipo1","dorsal":80} |
| amarilla-006-2 | train | Amarilla al dorsal ochenta nuestro | {"evento":"amarilla","equipo":"equipo1","dorsal":80} |
| amarilla-006-3 | train | El dorsal ochenta de nuestro equipo fue amonestado. | {"evento":"amarilla","equipo":"equipo1","dorsal":80} |
| amarilla-007-1 | validation | Tarjeta amarilla al 88 de ellos. | {"evento":"amarilla","equipo":"equipo2","dorsal":88} |
| amarilla-007-2 | validation | Tarjeta amarilla al ochenta y ocho de ellos | {"evento":"amarilla","equipo":"equipo2","dorsal":88} |
| amarilla-007-3 | validation | El número ochenta y ocho del rival vio la amarilla. | {"evento":"amarilla","equipo":"equipo2","dorsal":88} |
| amarilla-008-1 | train | Amarilla para dorsal 90. | {"evento":"amarilla","equipo":"desconocido","dorsal":90} |
| amarilla-008-2 | train | Amarilla para dorsal noventa | {"evento":"amarilla","equipo":"desconocido","dorsal":90} |
| amarilla-008-3 | train | Tarjeta amarilla para quien lleva el noventa. | {"evento":"amarilla","equipo":"desconocido","dorsal":90} |
| amarilla-009-1 | train | Dorsal 99 rival amonestado. | {"evento":"amarilla","equipo":"equipo2","dorsal":99} |
| amarilla-009-2 | train | Dorsal noventa y nueve rival amonestado | {"evento":"amarilla","equipo":"equipo2","dorsal":99} |
| amarilla-009-3 | train | El dorsal noventa y nueve rival recibió amonestación. | {"evento":"amarilla","equipo":"equipo2","dorsal":99} |
| amarilla-010-1 | train | Hugo, dorsal 0, ve tarjeta amarilla para nosotros. | {"evento":"amarilla","equipo":"equipo1","nombre":"Hugo","dorsal":0} |
| amarilla-010-2 | train | Hugo dorsal cero ve tarjeta amarilla para nosotros | {"evento":"amarilla","equipo":"equipo1","nombre":"Hugo","dorsal":0} |
| amarilla-010-3 | train | La amarilla fue para Hugo, dorsal cero, de nuestro equipo. | {"evento":"amarilla","equipo":"equipo1","nombre":"Hugo","dorsal":0} |
| amarilla-011-1 | train | Amarilla a Raúl. | {"evento":"amarilla","equipo":"desconocido","nombre":"Raúl"} |
| amarilla-011-2 | train | Amarilla a Raul | {"evento":"amarilla","equipo":"desconocido","nombre":"Raul"} |
| amarilla-011-3 | train | Raúl fue amonestado. | {"evento":"amarilla","equipo":"desconocido","nombre":"Raúl"} |
| amarilla-012-1 | train | Íñigo amonestado para ellos. | {"evento":"amarilla","equipo":"equipo2","nombre":"Íñigo"} |
| amarilla-012-2 | train | Inigo amonestado para ellos | {"evento":"amarilla","equipo":"equipo2","nombre":"Inigo"} |
| amarilla-012-3 | train | Íñigo recibió tarjeta amarilla con ellos. | {"evento":"amarilla","equipo":"equipo2","nombre":"Íñigo"} |
| amarilla-013-1 | train | Tarjeta amarilla para Hugo, de ellos. | {"evento":"amarilla","equipo":"equipo2","nombre":"Hugo"} |
| amarilla-013-2 | train | Tarjeta amarilla para Hugo de ellos | {"evento":"amarilla","equipo":"equipo2","nombre":"Hugo"} |
| amarilla-013-3 | train | El Hugo del equipo rival se llevó la amonestación. | {"evento":"amarilla","equipo":"equipo2","nombre":"Hugo"} |
| amarilla-014-1 | train | Sergio recibe amarilla, nuestro jugador. | {"evento":"amarilla","equipo":"equipo1","nombre":"Sergio"} |
| amarilla-014-2 | train | Sergio recibe amarilla nuestro jugador | {"evento":"amarilla","equipo":"equipo1","nombre":"Sergio"} |
| amarilla-014-3 | train | A Sergio, que juega con nosotros, le sacaron amarilla. | {"evento":"amarilla","equipo":"equipo1","nombre":"Sergio"} |
| amarilla-015-1 | train | Tarjeta amarilla al equipo Águilas. | {"evento":"amarilla","equipo":"equipo1"} |
| amarilla-015-2 | train | Tarjeta amarilla al equipo Aguilas | {"evento":"amarilla","equipo":"equipo1"} |
| amarilla-015-3 | train | Águilas fue amonestado con una tarjeta amarilla. | {"evento":"amarilla","equipo":"equipo1"} |
| descalificacion-001-1 | train | Descalificación para los nuestros. | {"evento":"descalificacion","equipo":"equipo1"} |
| descalificacion-001-2 | train | Descalificacion para los nuestros | {"evento":"descalificacion","equipo":"equipo1"} |
| descalificacion-001-3 | train | Uno de los nuestros recibió la descalificación. | {"evento":"descalificacion","equipo":"equipo1"} |
| descalificacion-002-1 | validation | Marta, dorsal 6, recibe tarjeta roja. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Marta","dorsal":6} |
| descalificacion-002-2 | validation | Marta dorsal seis recibe tarjeta roja | {"evento":"descalificacion","equipo":"desconocido","nombre":"Marta","dorsal":6} |
| descalificacion-002-3 | validation | Marta, dorsal seis, vio la tarjeta roja. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Marta","dorsal":6} |
| descalificacion-003-1 | validation | Descalificación de Lucía; María ha provocado la roja. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Lucía","nombre_relacionado":"María"} |
| descalificacion-003-2 | validation | Descalificacion de Lucia Maria ha provocado la roja | {"evento":"descalificacion","equipo":"desconocido","nombre":"Lucia","nombre_relacionado":"Maria"} |
| descalificacion-003-3 | validation | María provocó la descalificación de Lucía. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Lucía","nombre_relacionado":"María"} |
| descalificacion-004-1 | train | Roja para ellos. | {"evento":"descalificacion","equipo":"equipo2"} |
| descalificacion-004-2 | train | Roja para ellos | {"evento":"descalificacion","equipo":"equipo2"} |
| descalificacion-004-3 | train | El equipo contrario recibió una roja. | {"evento":"descalificacion","equipo":"equipo2"} |
| descalificacion-005-1 | train | Carmen es descalificada, del equipo rival. | {"evento":"descalificacion","equipo":"equipo2","nombre":"Carmen"} |
| descalificacion-005-2 | train | Carmen es descalificada del equipo rival | {"evento":"descalificacion","equipo":"equipo2","nombre":"Carmen"} |
| descalificacion-005-3 | train | Carmen, que está con el rival, fue descalificada. | {"evento":"descalificacion","equipo":"equipo2","nombre":"Carmen"} |
| descalificacion-006-1 | train | Roja al dorsal 7 nuestro. | {"evento":"descalificacion","equipo":"equipo1","dorsal":7} |
| descalificacion-006-2 | train | Roja al dorsal siete nuestro | {"evento":"descalificacion","equipo":"equipo1","dorsal":7} |
| descalificacion-006-3 | train | El dorsal siete de los nuestros quedó descalificado. | {"evento":"descalificacion","equipo":"equipo1","dorsal":7} |
| descalificacion-007-1 | test | Descalificado el dorsal 9 de ellos. | {"evento":"descalificacion","equipo":"equipo2","dorsal":9} |
| descalificacion-007-2 | test | Descalificado el dorsal nueve de ellos | {"evento":"descalificacion","equipo":"equipo2","dorsal":9} |
| descalificacion-007-3 | test | El número nueve de ellos recibió la roja. | {"evento":"descalificacion","equipo":"equipo2","dorsal":9} |
| descalificacion-008-1 | train | Tarjeta roja al dorsal 10. | {"evento":"descalificacion","equipo":"desconocido","dorsal":10} |
| descalificacion-008-2 | train | Tarjeta roja al dorsal diez | {"evento":"descalificacion","equipo":"desconocido","dorsal":10} |
| descalificacion-008-3 | train | Al dorsal diez le mostraron tarjeta roja. | {"evento":"descalificacion","equipo":"desconocido","dorsal":10} |
| descalificacion-009-1 | train | Dorsal 11 rival descalificado. | {"evento":"descalificacion","equipo":"equipo2","dorsal":11} |
| descalificacion-009-2 | train | Dorsal once rival descalificado | {"evento":"descalificacion","equipo":"equipo2","dorsal":11} |
| descalificacion-009-3 | train | El once del equipo rival quedó descalificado. | {"evento":"descalificacion","equipo":"equipo2","dorsal":11} |
| descalificacion-010-1 | train | Álvaro, dorsal 12, recibe roja para nuestro equipo. | {"evento":"descalificacion","equipo":"equipo1","nombre":"Álvaro","dorsal":12} |
| descalificacion-010-2 | train | Alvaro dorsal doce recibe roja para nuestro equipo | {"evento":"descalificacion","equipo":"equipo1","nombre":"Alvaro","dorsal":12} |
| descalificacion-010-3 | train | Álvaro, nuestro dorsal doce, recibió una roja y quedó descalificado. | {"evento":"descalificacion","equipo":"equipo1","nombre":"Álvaro","dorsal":12} |
| descalificacion-011-1 | train | Roja para Jesús, dorsal 13, provocada por Andrés, dorsal 16. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Jesús","nombre_relacionado":"Andrés","dorsal_relacionado":16,"dorsal":13} |
| descalificacion-011-2 | train | Roja para Jesus dorsal trece provocada por Andres dorsal dieciseis | {"evento":"descalificacion","equipo":"desconocido","nombre":"Jesus","nombre_relacionado":"Andres","dorsal_relacionado":16,"dorsal":13} |
| descalificacion-011-3 | train | Andrés, dorsal dieciséis, provocó la roja de Jesús, dorsal 13. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Jesús","nombre_relacionado":"Andrés","dorsal_relacionado":16,"dorsal":13} |
| descalificacion-012-1 | train | Daniel recibe tarjeta roja para ellos. | {"evento":"descalificacion","equipo":"equipo2","nombre":"Daniel"} |
| descalificacion-012-2 | train | Daniel recibe tarjeta roja para ellos | {"evento":"descalificacion","equipo":"equipo2","nombre":"Daniel"} |
| descalificacion-012-3 | train | A Daniel le enseñaron la roja por el equipo rival. | {"evento":"descalificacion","equipo":"equipo2","nombre":"Daniel"} |
| descalificacion-013-1 | test | Descalificación de Álvaro. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Álvaro"} |
| descalificacion-013-2 | test | Descalificacion de Alvaro | {"evento":"descalificacion","equipo":"desconocido","nombre":"Alvaro"} |
| descalificacion-013-3 | test | Álvaro quedó descalificado. | {"evento":"descalificacion","equipo":"desconocido","nombre":"Álvaro"} |
| descalificacion-014-1 | train | José recibe roja y tarjeta azul. | {"evento":"descalificacion","equipo":"desconocido","nombre":"José","azul":true} |
| descalificacion-014-2 | train | Jose recibe roja y tarjeta azul | {"evento":"descalificacion","equipo":"desconocido","nombre":"Jose","azul":true} |
| descalificacion-014-3 | train | José fue expulsado y además recibió la tarjeta azul. | {"evento":"descalificacion","equipo":"desconocido","nombre":"José","azul":true} |
| descalificacion-015-1 | train | Tarjeta azul y descalificación al equipo Bidasoa. | {"evento":"descalificacion","equipo":"equipo2","azul":true} |
| descalificacion-015-2 | train | Tarjeta azul y descalificacion al equipo Bidasoa | {"evento":"descalificacion","equipo":"equipo2","azul":true} |
| descalificacion-015-3 | train | Bidasoa recibió una descalificación con tarjeta azul. | {"evento":"descalificacion","equipo":"equipo2","azul":true} |
| pasivo-001-1 | train | Pasivo para nosotros. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-001-2 | train | Pasivo para nosotros | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-001-3 | train | Nos señalaron juego pasivo. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-002-1 | train | El árbitro pita pasivo a nuestro equipo. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-002-2 | train | El arbitro pita pasivo a nuestro equipo | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-002-3 | train | El árbitro pitó pasivo contra nosotros. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-003-1 | train | Nos pitan juego pasivo. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-003-2 | train | Nos pitan juego pasivo | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-003-3 | train | El juego pasivo se lo sancionaron a los nuestros. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-004-1 | train | Pasivo para ellos. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-004-2 | train | Pasivo para ellos | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-004-3 | train | Ellos quedaron señalados por pasivo. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-005-1 | train | El árbitro pita pasivo al rival. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-005-2 | train | El arbitro pita pasivo al rival | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-005-3 | train | La árbitra pitó juego pasivo al equipo rival. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-006-1 | train | Juego pasivo señalado contra los nuestros. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-006-2 | train | Juego pasivo senalado contra los nuestros | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-006-3 | train | La sanción de pasivo fue para nuestro lado. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-007-1 | validation | Pasivo pitado al equipo contrario. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-007-2 | validation | Pasivo pitado al equipo contrario | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-007-3 | validation | Al otro equipo le pitaron juego pasivo. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-008-1 | validation | Han pitado juego pasivo. | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-008-2 | validation | Han pitado juego pasivo | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-008-3 | validation | Pitaron juego pasivo, pero no se dijo a quién. | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-009-1 | train | Pitan pasivo contra el rival. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-009-2 | train | Pitan pasivo contra el rival | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-009-3 | train | La falta de pasivo se la señalaron al contrario. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-010-1 | train | Pitan pasivo a nuestro lado. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-010-2 | train | Pitan pasivo a nuestro lado | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-010-3 | train | La árbitra detuvo nuestro ataque por pasivo. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-011-1 | train | Pasivo nuestro en el minuto veintiuno. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-011-2 | train | Pasivo nuestro en el minuto veintiuno | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-011-3 | train | En el minuto veintiuno nos pitaron pasivo. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-012-1 | train | Juego pasivo para ellos. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-012-2 | train | Juego pasivo para ellos | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-012-3 | train | A ellos les señalaron juego pasivo. | {"evento":"pasivo","equipo":"equipo2"} |
| pasivo-013-1 | test | Pasivo para el equipo local. | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-013-2 | test | Pasivo para el equipo local | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-013-3 | test | Pitaron pasivo al equipo local. | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-014-1 | train | Pasivo para el equipo visitante. | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-014-2 | train | Pasivo para el equipo visitante | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-014-3 | train | Señalaron juego pasivo al equipo visitante. | {"evento":"pasivo","equipo":"desconocido"} |
| pasivo-015-1 | test | Pitan pasivo al club Marineras. | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-015-2 | test | Pitan pasivo al club Marineras | {"evento":"pasivo","equipo":"equipo1"} |
| pasivo-015-3 | test | A Marineras les señalaron juego pasivo. | {"evento":"pasivo","equipo":"equipo1"} |
| infraccion-001-1 | train | Infracción de nuestro equipo. | {"evento":"infraccion","equipo":"equipo1"} |
| infraccion-001-2 | train | Infraccion de nuestro equipo | {"evento":"infraccion","equipo":"equipo1"} |
| infraccion-001-3 | train | Nuestro equipo cometió una infracción. | {"evento":"infraccion","equipo":"equipo1"} |
| infraccion-002-1 | validation | Alicia, dorsal 17, comete pasos para nosotros. | {"evento":"infraccion","equipo":"equipo1","nombre":"Alicia","infraccion":"Pasos","dorsal":17} |
| infraccion-002-2 | validation | Alicia dorsal diecisiete comete pasos para nosotros | {"evento":"infraccion","equipo":"equipo1","nombre":"Alicia","infraccion":"Pasos","dorsal":17} |
| infraccion-002-3 | validation | Nuestra Alicia, dorsal diecisiete, ha cometido pasos. | {"evento":"infraccion","equipo":"equipo1","nombre":"Alicia","infraccion":"Pasos","dorsal":17} |
| infraccion-003-1 | train | Beatriz hace dobles. | {"evento":"infraccion","equipo":"desconocido","nombre":"Beatriz","infraccion":"Dobles"} |
| infraccion-003-2 | train | Beatriz hace dobles | {"evento":"infraccion","equipo":"desconocido","nombre":"Beatriz","infraccion":"Dobles"} |
| infraccion-003-3 | train | Beatriz hizo dobles. | {"evento":"infraccion","equipo":"desconocido","nombre":"Beatriz","infraccion":"Dobles"} |
| infraccion-004-1 | train | Pisando el área por parte de ellos. | {"evento":"infraccion","equipo":"equipo2","infraccion":"Pisando"} |
| infraccion-004-2 | train | Pisando el area por parte de ellos | {"evento":"infraccion","equipo":"equipo2","infraccion":"Pisando"} |
| infraccion-004-3 | train | El equipo rival pisó el área. | {"evento":"infraccion","equipo":"equipo2","infraccion":"Pisando"} |
| infraccion-005-1 | train | Teresa, del equipo rival, comete pasos. | {"evento":"infraccion","equipo":"equipo2","nombre":"Teresa","infraccion":"Pasos"} |
| infraccion-005-2 | train | Teresa del equipo rival comete pasos | {"evento":"infraccion","equipo":"equipo2","nombre":"Teresa","infraccion":"Pasos"} |
| infraccion-005-3 | train | Teresa, del rival, cometió pasos. | {"evento":"infraccion","equipo":"equipo2","nombre":"Teresa","infraccion":"Pasos"} |
| infraccion-006-1 | train | Dobles del dorsal 21 nuestro. | {"evento":"infraccion","equipo":"equipo1","dorsal":21,"infraccion":"Dobles"} |
| infraccion-006-2 | train | Dobles del dorsal veintiuno nuestro | {"evento":"infraccion","equipo":"equipo1","dorsal":21,"infraccion":"Dobles"} |
| infraccion-006-3 | train | El dorsal veintiuno de los nuestros hizo dobles. | {"evento":"infraccion","equipo":"equipo1","dorsal":21,"infraccion":"Dobles"} |
| infraccion-007-1 | train | El dorsal 22 de ellos pisa el área. | {"evento":"infraccion","equipo":"equipo2","dorsal":22,"infraccion":"Pisando"} |
| infraccion-007-2 | train | eh El dorsal veintidos de ellos pisa el area vale | {"evento":"infraccion","equipo":"equipo2","dorsal":22,"infraccion":"Pisando"} |
| infraccion-007-3 | train | El dorsal veintidós de ellos pisó el área. | {"evento":"infraccion","equipo":"equipo2","dorsal":22,"infraccion":"Pisando"} |
| infraccion-008-1 | train | Pasos del dorsal 23. | {"evento":"infraccion","equipo":"desconocido","dorsal":23,"infraccion":"Pasos"} |
| infraccion-008-2 | train | Pasos del dorsal veintitres | {"evento":"infraccion","equipo":"desconocido","dorsal":23,"infraccion":"Pasos"} |
| infraccion-008-3 | train | El dorsal veintitrés cometió pasos. | {"evento":"infraccion","equipo":"desconocido","dorsal":23,"infraccion":"Pasos"} |
| infraccion-009-1 | train | Dobles del dorsal 26 rival. | {"evento":"infraccion","equipo":"equipo2","dorsal":26,"infraccion":"Dobles"} |
| infraccion-009-2 | train | Dobles del dorsal veintiseis rival | {"evento":"infraccion","equipo":"equipo2","dorsal":26,"infraccion":"Dobles"} |
| infraccion-009-3 | train | El dorsal veintiséis rival hizo dobles. | {"evento":"infraccion","equipo":"equipo2","dorsal":26,"infraccion":"Dobles"} |
| infraccion-010-1 | test | Pedro, dorsal 30, de nuestro equipo, comete pasos. | {"evento":"infraccion","equipo":"equipo1","nombre":"Pedro","infraccion":"Pasos","dorsal":30} |
| infraccion-010-2 | test | Pedro dorsal treinta de nuestro equipo comete pasos | {"evento":"infraccion","equipo":"equipo1","nombre":"Pedro","infraccion":"Pasos","dorsal":30} |
| infraccion-010-3 | test | Pedro, dorsal treinta, cometió pasos con los nuestros. | {"evento":"infraccion","equipo":"equipo1","nombre":"Pedro","infraccion":"Pasos","dorsal":30} |
| infraccion-011-1 | validation | Antonio, del equipo rival, hace dobles. | {"evento":"infraccion","equipo":"equipo2","nombre":"Antonio","infraccion":"Dobles"} |
| infraccion-011-2 | validation | Antonio del equipo rival hace dobles | {"evento":"infraccion","equipo":"equipo2","nombre":"Antonio","infraccion":"Dobles"} |
| infraccion-011-3 | validation | Antonio, que juega en el rival, cometió dobles. | {"evento":"infraccion","equipo":"equipo2","nombre":"Antonio","infraccion":"Dobles"} |
| infraccion-012-1 | train | Marcos, del rival, pisa el área. | {"evento":"infraccion","equipo":"equipo2","nombre":"Marcos","infraccion":"Pisando"} |
| infraccion-012-2 | train | Marcos del rival pisa el area | {"evento":"infraccion","equipo":"equipo2","nombre":"Marcos","infraccion":"Pisando"} |
| infraccion-012-3 | train | Marcos, del otro equipo, pisó el área. | {"evento":"infraccion","equipo":"equipo2","nombre":"Marcos","infraccion":"Pisando"} |
| infraccion-013-1 | train | Pedro comete infracción para ellos. | {"evento":"infraccion","equipo":"equipo2","nombre":"Pedro"} |
| infraccion-013-2 | train | Pedro comete infraccion para ellos | {"evento":"infraccion","equipo":"equipo2","nombre":"Pedro"} |
| infraccion-013-3 | train | Pedro, del rival, cometió una infracción. | {"evento":"infraccion","equipo":"equipo2","nombre":"Pedro"} |
| infraccion-014-1 | train | Rubén, del equipo rival, hace pasos. | {"evento":"infraccion","equipo":"equipo2","nombre":"Rubén","infraccion":"Pasos"} |
| infraccion-014-2 | train | Ruben del equipo rival hace pasos | {"evento":"infraccion","equipo":"equipo2","nombre":"Ruben","infraccion":"Pasos"} |
| infraccion-014-3 | train | Rubén, que juega en el rival, dio pasos. | {"evento":"infraccion","equipo":"equipo2","nombre":"Rubén","infraccion":"Pasos"} |
| infraccion-015-1 | test | Infracción de los jugadores del club Río Verde. | {"evento":"infraccion","equipo":"equipo2"} |
| infraccion-015-2 | test | Infraccion de los jugadores del club Rio Verde | {"evento":"infraccion","equipo":"equipo2"} |
| infraccion-015-3 | test | Los jugadores de Río Verde cometieron infracción. | {"evento":"infraccion","equipo":"equipo2"} |
| rechazo-001-1 | train | Qué bien estamos jugando hoy. | [] |
| rechazo-001-2 | train | Que bien estamos jugando hoy | [] |
| rechazo-001-3 | train | ¡Qué buen partido estamos viendo! | [] |
| rechazo-002-1 | train | ¡Vamos, vamos! | [] |
| rechazo-002-2 | train | Vamos vamos | [] |
| rechazo-002-3 | train | ¡Vamos equipo, que se puede! | [] |
| rechazo-003-1 | train | El pabellón está lleno. | [] |
| rechazo-003-2 | train | El pabellon esta lleno | [] |
| rechazo-003-3 | train | Hoy el pabellón está a rebosar. | [] |
| rechazo-004-1 | train | Pásame la botella. | [] |
| rechazo-004-2 | train | Pasame la botella | [] |
| rechazo-004-3 | train | ¿Me acercas la botella, por favor? | [] |
| rechazo-005-1 | train | La camiseta azul es bonita. | [] |
| rechazo-005-2 | train | La camiseta azul es bonita | [] |
| rechazo-005-3 | train | Me gusta más la camiseta azul. | [] |
| rechazo-006-1 | train | No ha sido gol. | [] |
| rechazo-006-2 | train | No ha sido gol | [] |
| rechazo-006-3 | train | El árbitro no concedió ese tanto. | [] |
| rechazo-007-1 | validation | No hubo parada. | [] |
| rechazo-007-2 | validation | No hubo parada | [] |
| rechazo-007-3 | validation | No hubo ninguna intervención del portero. | [] |
| rechazo-008-1 | train | No es penalti para nosotros. | [] |
| rechazo-008-2 | train | No es penalti para nosotros | [] |
| rechazo-008-3 | train | Para mí eso no es penalti a nuestro favor. | [] |
| rechazo-009-1 | train | No excluyas a Ana. | [] |
| rechazo-009-2 | train | No excluyas a Ana | [] |
| rechazo-009-3 | train | No le saques a Ana de la cancha. | [] |
| rechazo-010-1 | validation | No perdió el balón. | [] |
| rechazo-010-2 | validation | No perdio el balon | [] |
| rechazo-010-3 | validation | El balón no lo perdió nadie. | [] |
| rechazo-011-1 | train | Gol nuestro y luego pérdida de ellos. | [] |
| rechazo-011-2 | train | Gol nuestro y luego perdida de ellos | [] |
| rechazo-011-3 | train | Primero marcamos nosotros y después el rival perdió el balón. | [] |
| rechazo-012-1 | train | Parada y contraataque con gol. | [] |
| rechazo-012-2 | train | Parada y contraataque con gol | [] |
| rechazo-012-3 | train | La detuvo el portero y después llegó un gol de contraataque. | [] |
| rechazo-013-1 | test | Amarilla y dos minutos para ella. | [] |
| rechazo-013-2 | test | Amarilla y dos minutos para ella | [] |
| rechazo-013-3 | test | A ella le mostraron la amarilla y a otra jugadora la excluyeron. | [] |
| rechazo-014-1 | validation | Marta recupera y Ana marca. | [] |
| rechazo-014-2 | validation | Marta recupera y Ana marca | [] |
| rechazo-014-3 | validation | Ana convirtió después de que Marta recuperara la pelota. | [] |
| rechazo-015-1 | train | Pérdida, recuperación y gol. | [] |
| rechazo-015-2 | train | Perdida recuperacion y gol | [] |
| rechazo-015-3 | train | Tras la recuperación llegó un gol, pero también hubo una pérdida. | [] |
| rechazo-016-1 | train | Ana María. | [] |
| rechazo-016-2 | train | Ana Maria | [] |
| rechazo-016-3 | train | María José está en la cancha. | [] |
| rechazo-017-1 | train | Dorsal seis. | [] |
| rechazo-017-2 | train | Dorsal seis | [] |
| rechazo-017-3 | train | ¿Quién lleva el dorsal seis? | [] |
| rechazo-018-1 | train | Pásasela a Lucía. | [] |
| rechazo-018-2 | train | Pasasela a Lucia | [] |
| rechazo-018-3 | train | Lucía, busca a tu compañera. | [] |
| rechazo-019-1 | test | Que tire el siete. | [] |
| rechazo-019-2 | test | Que tire el siete | [] |
| rechazo-019-3 | test | Pablo, prueba un lanzamiento desde fuera. | [] |
| rechazo-020-1 | train | Corre hacia atrás. | [] |
| rechazo-020-2 | train | Corre hacia atras | [] |
| rechazo-020-3 | train | Bajad a defender, por favor. | [] |
| rechazo-021-1 | validation | ¿Ha sido gol de ellos? | [] |
| rechazo-021-2 | validation | Me pregunto ha sido gol de ellos | [] |
| rechazo-021-3 | validation | ¿Seguro que el gol fue del equipo contrario? | [] |
| rechazo-022-1 | test | ¿Le han sacado amarilla al seis? | [] |
| rechazo-022-2 | test | Me pregunto le han sacado amarilla al seis | [] |
| rechazo-022-3 | test | ¿El dorsal seis fue amonestado? | [] |
| rechazo-023-1 | train | ¿Eso cuenta como pasos? | [] |
| rechazo-023-2 | train | Me pregunto eso cuenta como pasos | [] |
| rechazo-023-3 | train | ¿Eso que hizo cuenta como pasos? | [] |
| rechazo-024-1 | train | Vamos doce a diez. | [] |
| rechazo-024-2 | train | Vamos doce a diez | [] |
| rechazo-024-3 | train | El tanteador marca doce a diez. | [] |
| rechazo-025-1 | train | Quedan seis minutos. | [] |
| rechazo-025-2 | train | Quedan seis minutos | [] |
| rechazo-025-3 | train | Quedan seis minutos de encuentro. | [] |
| rechazo-026-1 | train | Minuto siete de la segunda parte. | [] |
| rechazo-026-2 | train | Minuto siete de la segunda parte | [] |
| rechazo-026-3 | train | Estamos en el minuto siete del segundo tiempo. | [] |
| rechazo-027-1 | train | El marcador está empatado a veinte. | [] |
| rechazo-027-2 | train | El marcador esta empatado a veinte | [] |
| rechazo-027-3 | train | Los dos equipos van empatados a veinte. | [] |
| rechazo-028-1 | train | Descanso, quince catorce. | [] |
| rechazo-028-2 | train | Descanso quince catorce | [] |
| rechazo-028-3 | train | Se llegó al descanso con quince a catorce. | [] |
| rechazo-029-1 | train | Se fue fuera. | [] |
| rechazo-029-2 | train | Se fue fuera | [] |
| rechazo-029-3 | train | El balón salió del campo. | [] |
| rechazo-030-1 | test | Falta ahí. | [] |
| rechazo-030-2 | test | Falta ahi | [] |
| rechazo-030-3 | test | El árbitro ha pitado una falta. | [] |
| ambiguo-001-1 | validation | Han sancionado a nuestro seis, no distingo qué tarjeta. | {"evento":"desconocido","equipo":"equipo1","dorsal":6} |
| ambiguo-001-2 | validation | Han sancionado a nuestro seis no distingo que tarjeta | {"evento":"desconocido","equipo":"equipo1","dorsal":6} |
| ambiguo-001-3 | validation | Han sancionado a nuestro seis, pero no distingo si fue amarilla o roja. | {"evento":"desconocido","equipo":"equipo1","dorsal":6} |
| ambiguo-002-1 | train | Le han pitado algo al ocho rival; no he visto la señal. | {"evento":"desconocido","equipo":"equipo2","dorsal":8} |
| ambiguo-002-2 | train | al 8 de ellos le han pitado algo no he visto que | {"evento":"desconocido","equipo":"equipo2","dorsal":8} |
| ambiguo-002-3 | train | El árbitro sancionó al dorsal ocho del contrario, pero no sé qué ha pitado. | {"evento":"desconocido","equipo":"equipo2","dorsal":8} |
| ambiguo-003-1 | test | Han sancionado a Inés; no sé si son dos minutos o roja. | {"evento":"desconocido","equipo":"desconocido","nombre":"Inés"} |
| ambiguo-003-2 | test | han sancionado a Ines no se si son 2 minutos o roja | {"evento":"desconocido","equipo":"desconocido","nombre":"Ines"} |
| ambiguo-003-3 | test | Inés ha recibido una sanción, pero no distingo si es exclusión o descalificación. | {"evento":"desconocido","equipo":"desconocido","nombre":"Inés"} |
| ambiguo-004-1 | train | Buen pase de Marta. | [] |
| ambiguo-004-2 | train | Buen pase de Marta | [] |
| ambiguo-004-3 | train | Marta dio un buen pase. | [] |
| ambiguo-005-1 | train | Siete metros. | [] |
| ambiguo-005-2 | train | Siete metros | [] |
| ambiguo-005-3 | train | ¿Se ha señalado un lanzamiento de siete metros? | [] |
