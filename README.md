# Xispa Creative Suite

Suite creativa para Windows. [Descargar la versión estable](https://github.com/XispasStudios/XispasInstaller/releases/latest).

## Elige tu edición

- **x64:** PC Intel/AMD con Windows de 64 bits.
- **ARM64:** PC con Windows ARM64.
- **ia32 (x86):** edición de compatibilidad para Windows de 32 bits.

Cada publicación identifica la arquitectura en el nombre del EXE. La caché interna del programa no es el EXE portátil que debes abrir.

## Actualizaciones

La Suite selecciona automáticamente el canal de su arquitectura:

- x64: `https://github.com/XispasStudios/XispasInstaller/releases/latest/download/updates.json`
- ARM64: `https://github.com/XispasStudios/XispasInstaller/releases/latest/download/updates-arm64.json`
- ia32: `https://github.com/XispasStudios/XispasInstaller/releases/latest/download/updates-ia32.json`

Cada versión estable incluye los ejecutables y los tres catálogos como archivos separados. La Suite comprueba la firma Ed25519, la arquitectura, el tamaño y la huella SHA256 antes de aceptar una actualización; conserva los datos fuera del EXE y pide guardar y confirmar el reinicio. La descarga en segundo plano puede desactivarse en Actualizaciones.

Si una versión anterior muestra «Las rutas locales de actualización no son válidas», cierra la Suite y abre una vez el EXE corregido desde la misma carpeta del portátil anterior, conservando las carpetas de datos existentes. Ese fallo del instalador anterior no indica por sí solo que tu PC tenga una arquitectura incorrecta.

Los doce programas disponen de paquetes independientes por arquitectura. Sus números de versión pueden ser distintos del launcher cuando una entrega solo corrige la Suite. Los paquetes ASAR de programas se instalan desde la Suite y no son EXE autónomos.

## Distribución

Este repositorio contiene los paquetes de distribución y catálogos de actualización firmados. El código fuente de desarrollo y la clave privada de firma permanecen privados. Las comprobaciones estáticas de integridad y empaquetado no sustituyen la comprobación manual del arranque y la actualización en Windows; las notas de cada publicación indican su alcance.

## Comunidades

Compartir cuentas y comunidades entre ordenadores requiere un servidor de Xispa configurado. Este repositorio distribuye el programa y no aloja los datos personales de la Suite.
