# Xispa Creative Suite

## Linux: edición activa

**Xispa Creative Suite para Linux 1.0.2 es la edición activa para Linux x86_64.** La primera edición independiente fue Linux 1.0.0.

[Descargar Linux 1.0.2](https://github.com/XispasStudios/XispasInstaller/releases/tag/linux-v1.0.2)

Descarga `Xispa-Creative-Suite-1.0.2-Linux-x64.zip`, extrae su carpeta y ejecuta `instalar-linux.sh`. Después abre **Xispa Creative Suite para Linux** desde el menú. También puedes ejecutar `iniciar.sh` para abrirla sin instalación. Incluye Electron para Linux; no necesita Wine ni compilar Rust.

La edición Linux recupera la interfaz, recursos y las doce aplicaciones de Xispa 0.3.77 para adaptarlos a Linux. Figstudio no se incluye en esta primera edición. Se ha comprobado en Pop!_OS x86_64. Consulta las notas de la publicación para conocer el alcance de las pruebas y las funciones todavía no verificadas.

Linux 1.0.1 renueva el entorno de los editores, sus acciones y diálogos HTML, conservando el diseño del launcher y los motores WASM originales. Consulta las notas para conocer el alcance. Esta revisión se instala manualmente desde el ZIP; no incluye un catálogo firmado porque la clave privada original no está disponible. La verificación de firmas permanece activa.

Linux 1.0.2 distribuye la lógica JavaScript propia ofuscada y los ayudantes Python empaquetados. Las fuentes editables y herramientas de desarrollo no se incluyen en el paquete. Las descargas siguen siendo públicas. Esto dificulta la lectura directa, pero no cifra el producto ni garantiza impedir su análisis. Las licencias de terceros se conservan. La retirada de Discord de los motores WASM sigue pendiente y no se presenta como realizada en esta entrega.

### Actualizaciones Linux

Los lanzamientos de esta edición usan etiquetas **`linux-vVERSION`**, comenzando por `linux-v1.0.0`. El launcher Linux consulta únicamente este canal y no trata las versiones de Windows como actualizaciones Linux.

La primera versión se instala desde el ZIP. Para una futura actualización automática deben publicarse el ZIP Linux y `updates-v2-linux-x64.json`, firmado con la clave Ed25519 de Xispa, en la misma release Linux. El launcher muestra las notas, verifica firma, tamaño y SHA256 y permite reiniciar para instalar. Los proyectos, cuentas y preferencias se conservan fuera del programa. La versión anterior se envía a la papelera solo después de confirmar que la nueva interfaz arranca; si falla, se restaura la anterior.

Los programas disponen de accesos independientes y perfiles propios. Instalar o sustituir el launcher no borra los proyectos de los programas.

## Windows: fin de mantenimiento

**Windows 0.3.78 es la última versión de Windows y no recibirá nuevas actualizaciones.**

[Descargar la última edición histórica de Windows](https://github.com/XispasStudios/XispasInstaller/releases/tag/v0.3.78)

Se conservan sus EXE x64, ARM64 e ia32, los paquetes de programas y los catálogos firmados históricos. No se sustituyen por archivos Linux. Los canales antiguos V1 permanecen en 0.3.74 y los V2 de Windows en su última entrega publicada.

La edición Linux es una aplicación separada y una primera versión, no una actualización de Windows. Conserva tus carpetas de datos si cambias de sistema; esta publicación no incluye una migración automática de los perfiles Windows a Linux.

## Distribución y comunidades

Este repositorio distribuye la aplicación y los catálogos de actualización. El código fuente privado de desarrollo y la clave privada de firma permanecen privados. Las notas de cada publicación describen el alcance real de las comprobaciones.

Compartir cuentas y comunidades entre ordenadores requiere un servidor de Xispa configurado. Este repositorio no aloja los datos personales de la suite.
