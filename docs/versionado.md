# Versión visible y política de entregas

La entrega que añade la presentación previa a la práctica y la versión del menú es **1.0.0** (Android/iOS build 2). Por petición del usuario, cada cambio posterior incrementa la versión **menor** una vez por entrega: 1.0.0 → 1.1.0 → 1.2.0, salvo indicación expresa. Las ediciones, comprobaciones y commits internos de una misma entrega no generan nuevas versiones.

```sh
npm run version:minor
# Para una versión expresamente indicada:
npm run version:set -- 2.0.0
```

El script sincroniza `package.json`, las dos versiones del lockfile, Android `versionName`/`versionCode`, iOS `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` y el campo `version` de las fichas de tienda. Cada versión distinta aumenta el número de build nativo; repetir la misma versión no vuelve a incrementarlo. Los builds normales no cambian la versión.

El panel lateral muestra `v1.0.0` y, en un tamaño menor, los primeros **8 caracteres hexadecimales** del commit (4 bytes). Se incorporan con [define de Vite](https://vite.dev/config/shared-options.html#define) al compilar: una copia offline o cacheada identifica su propio código, sin consultar un servidor de versiones.

En Render se usa [`RENDER_GIT_COMMIT`](https://render.com/docs/environment-variables); también se admite `GITHUB_SHA`. En una compilación local se consulta Git. Un archivo de fuentes sin Git ni variable de CI muestra `—` en lugar de inventar un hash. Después de hacer el commit de una entrega se regenera `dist` para que su hash visible corresponda a ese commit. No se guarda un hash fijo en el código.

Para Android/iOS se recompila y sincroniza el bundle nativo con el mismo mecanismo. El empaquetador compara versión, número de build y hash del binario con su informe de verificación: un informe de 0.1.0 no permite renombrar ese APK como 1.0.0. Los informes históricos y artefactos anteriores conservan su versión original. El cambio de versión no modifica Dexie, datos de usuario ni preferencias de la bienvenida.
