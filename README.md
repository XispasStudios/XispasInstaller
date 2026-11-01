# Xispa Creative Suite

## Linux: edición nativa activa

**Xispa Creative Suite 2.0.0 para Linux x86_64** es la nueva edición activa, basada en el launcher Rust aportado por el propietario.

[Descargar la edición Rust 2.0.0](https://github.com/XispasStudios/XispasInstaller/releases/tag/native-v2.0.0)

Extrae `artcraft-launcher-2.0.0-linux-x86_64.tar.gz` y ejecuta:

```sh
./xispa-creative-suite-2.0.0/bin/artcraft-launcher --install-self
```

Después abre **Xispa Creative Suite** desde el menú de aplicaciones. El paquete contiene el ejecutable nativo y sus licencias; cada editor se descarga e instala por separado desde el catálogo. No requiere Electron, JavaScript ni compilar Rust en el equipo de destino. Probado en este PC Pop!_OS x86_64.

### Interfaz y aplicaciones

El launcher usa Rust y egui: fondo negro, paneles gris oscuro y controles azules redondeados. El acceso a cuentas también está implementado en Rust y utiliza el servicio de cuentas existente o las cuentas locales anteriores. Las sesiones nativas persistentes se cifran localmente y caducan.

El catálogo conserva las quince aplicaciones del launcher aportado: **Xispa Photocraft, Illustrate, Premiere Plus, Lightstudio, Document Pro, Beyond Effects, InLayout, Figstudio, Writer, Audiowave, Present, Autodraft, Sheets, Create y Solid**.

Son aplicaciones nativas independientes. Se descargan desde los repositorios oficiales fijados en el catálogo, con comprobación SHA-256. Los nombres Xispa y sus iconos se aplican al catálogo y a los accesos del sistema; los editores conservan sus interfaces internas y créditos originales. Esta entrega no recompila ni rediseña el interior de los quince editores.

### Actualizaciones y datos

El launcher nativo consulta exclusivamente el canal **`native-vVERSION`** de este repositorio para sus propias actualizaciones. Los editores consultan sus repositorios upstream. Esta edición se instala una vez manualmente; los launchers Linux antiguos no migran automáticamente a ella.

La instalación nativa del launcher está en `~/.local/share/xispa-native-launcher`. El catálogo instalado se registra en `~/.local/share/xispa-creative-suite`. Las cuentas locales anteriores siguen en `~/.config/Xispa Suite/suite-data`. Los proyectos y los perfiles anteriores se conservan fuera del programa.

En el PC del propietario se retiraron las instalaciones anteriores a la papelera, verificando que los datos protegidos permanecían intactos. Esa retirada no se ejecuta automáticamente en otros equipos.

Validación de esta entrega: 355 pruebas unitarias aprobadas, revisión Clippy sin avisos de código, compilación WebAssembly y prueba de arranque aislada de los quince editores. Esto no equivale a comprobar exhaustivamente cada herramienta de los editores upstream.

## Ediciones Linux anteriores

Las publicaciones `linux-v1.0.x` quedan como historial. La última de esa generación fue [Linux 1.0.11](https://github.com/XispasStudios/XispasInstaller/releases/tag/linux-v1.0.11), basada en Electron y motores WASM.

Notes, Canvas y Premiere basada en Concat pertenecen a esa generación y no forman parte del nuevo catálogo de quince aplicaciones. Sus datos anteriores se conservan. Las fuentes AGPL correspondientes a Premiere siguen disponibles en sus publicaciones históricas, incluida `Xispa-Premiere-1.0.6-Corresponding-Source.zip` en Linux 1.0.11.

Los catálogos firmados históricos y su comprobación no se modifican. El nuevo canal nativo utiliza su propio mecanismo de actualización y sumas SHA-256; no se presenta como un catálogo Ed25519 nuevo.

## Windows: fin de mantenimiento

**Windows 0.3.78 es la última versión de Windows y no recibirá nuevas actualizaciones.**

[Descargar la última edición histórica de Windows](https://github.com/XispasStudios/XispasInstaller/releases/tag/v0.3.78)

La publicación global marcada como Latest se conserva en Windows 0.3.78 para no enviar Linux a los launchers antiguos. Usa el enlace del canal nativo anterior para descargar Linux.

## Distribución y licencias

Este repositorio distribuye ejecutables y notas de actualización. Compilar Rust no cifra un programa ni garantiza impedir su análisis. No se publican claves privadas ni datos de cuentas.

Se incluyen licencias y atribuciones en `share/licenses`, conservando los derechos de los proyectos upstream y las obligaciones de sus dependencias. El código propio privado permanece fuera de los paquetes de distribución; las fuentes de componentes que deban publicarse por su licencia se conservan en sus canales correspondientes.

El repositorio no aloja datos personales del servicio de cuentas.
