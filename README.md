# Xispa Creative Suite

Suite creativa para Windows. [Descargar la versión estable](https://github.com/XispasStudios/XispasInstaller/releases/latest).

## Elige tu edición

- **x64:** PC Intel/AMD con Windows de 64 bits.
- **ARM64:** PC con Windows ARM64.
- **ia32 (x86):** edición de compatibilidad para Windows de 32 bits.

Cada publicación identifica la arquitectura en el nombre del EXE. La caché interna del programa no es el EXE portátil que debes abrir.

## Actualizaciones

A partir de la 0.3.76, la Suite utiliza el canal de firmas V2 y selecciona el catálogo de su arquitectura:

- x64: `https://github.com/XispasStudios/XispasInstaller/releases/latest/download/updates-v2.json`
- ARM64: `https://github.com/XispasStudios/XispasInstaller/releases/latest/download/updates-v2-arm64.json`
- ia32: `https://github.com/XispasStudios/XispasInstaller/releases/latest/download/updates-v2-ia32.json`

**Primera actualización desde la 0.3.74 o anteriores:** descarga una vez el EXE de tu arquitectura, guarda el trabajo, cierra la Suite y sus programas y sustituye el EXE en su ubicación habitual. Conserva las carpetas de datos, cuentas y proyectos. Esta primera transición al canal V2 es manual; no se presenta como comprobada mediante el actualizador nativo de Windows.

Los catálogos anteriores `updates.json`, `updates-arm64.json` y `updates-ia32.json` se conservan firmados y sin cambios en la 0.3.74 para las instalaciones del canal V1.

Cada versión estable incluye los ejecutables y los catálogos como archivos separados. La Suite comprueba la firma Ed25519, la arquitectura, el tamaño y la huella SHA256 antes de aceptar una actualización; conserva los datos fuera del EXE y pide guardar y confirmar el reinicio. La descarga en segundo plano puede desactivarse en Actualizaciones.

Si una versión anterior muestra «Las rutas locales de actualización no son válidas», cierra la Suite y abre una vez el EXE corregido desde la misma carpeta del portátil anterior, conservando las carpetas de datos existentes. Ese fallo del instalador anterior no indica por sí solo que tu PC tenga una arquitectura incorrecta.

Los trece programas disponen de paquetes independientes por arquitectura. Sus números de versión pueden ser distintos del launcher cuando una entrega solo corrige la Suite. Los paquetes ASAR de programas se instalan desde la Suite y no son EXE autónomos. Los tres catálogos de programas V2 se publican juntos en este repositorio y la Suite los utiliza según su arquitectura. La 0.3.78 incorpora Xispa Figstudio; los paquetes de programas de esta entrega requieren la Suite 0.3.78, que debe actualizarse primero.

## Distribución

Este repositorio contiene los paquetes de distribución y catálogos de actualización firmados. El código fuente de desarrollo y la clave privada de firma permanecen privados. Las comprobaciones estáticas de integridad y empaquetado no sustituyen la comprobación manual del arranque y la actualización en Windows; las notas de cada publicación indican su alcance.

## Comunidades

Compartir cuentas y comunidades entre ordenadores requiere un servidor de Xispa configurado. Este repositorio distribuye el programa y no aloja los datos personales de la Suite.
