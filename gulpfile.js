// Импорт пакетов
const gulp = require('gulp')
const nodePath = require('path')
const fs = require('fs')
const replace = require('gulp-replace')
const plumber = require('gulp-plumber');
const notify = require("gulp-notify");
const versionNumber = require('gulp-version-number');
const sass = require('gulp-sass')(require('sass'))
const rename = require('gulp-rename')
const cleanCSS = require('gulp-clean-css')
const groupCssMediaQueries = require('gulp-group-css-media-queries');
const ts = require('gulp-typescript')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const concat = require('gulp-concat')
const sourcemaps = require('gulp-sourcemaps')
const autoprefixer = require('gulp-autoprefixer')
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const size = require('gulp-size')
const newer = require('gulp-newer')
const browsersync = require('browser-sync').create()
const del = require('del')
const posthtml = require('gulp-posthtml')
const include = require('posthtml-include')
const htmlBeautify = require('gulp-html-beautify')
const tinypng = require('gulp-tinypng-extended')
const responsive = require('gulp-responsive')
const responsiveConfig = require('gulp-responsive-config')
const webp = require('gulp-webp')
const fonter = require('gulp-fonter')
const ttf2woff2 = require('gulp-ttf2woff2')

// Получаем имя папки проекта (gulp_build)
const rootFolder = nodePath.basename(nodePath.resolve());

// Базовые пути к файлам
const basePath = {
  src: './_src',
  dev: './docs', 
  blocks: '_src/blocks',
  imgOpt: '_src/img',
}

// Пути к отдельным компонентам
const paths = {
  files: {
    src: basePath.src + '/files/**/*.*',
    dest: basePath.dev + '/files/',
    watch: basePath.src + '/files/**/*.*',
  },
  html: {
    src: [basePath.src + '/*.html', basePath.src + '/*.pug'],
    dest: basePath.dev,
    watch: 
      [basePath.src + '/*.html',
        // Чтобы watch не тормозил прописываем каждую папку отдельно
        // Ниже по коду добавим пути к файлам отдельными блоками
      ],
  },
  stylesScss: {
    src: basePath.src + '/styles/style.scss',
    dest: basePath.dev + '/css/',
    watch: 
    [basePath.src + '/styles/*.scss',
      // Чтобы watch не тормозил прописываем каждую папку отдельно
      // Ниже по коду добавим пути к файлам отдельными блоками
    ],
  },
  images: {
    src: basePath.blocks,
    dest: basePath.imgOpt,
    watch: [
      // Чтобы watch не тормозил прописываем каждую папку отдельно
      // Ниже по коду добавим пути к файлам отдельными блоками
    ],
  },
  imagesOpt: {
    src: basePath.imgOpt,
    dest: basePath.dev + '/img/',
    watch: [
      // Чтобы watch не тормозил прописываем каждую папку отдельно
      // Ниже по коду добавим пути к файлам отдельными блоками
    ],    
  },
  svgicons: {
    src: basePath.imgOpt + '/icons/icon-*.svg',
    dest: basePath.blocks + '/icons/',
    watch: basePath.imgOpt + '/icons/icon-*.svg',
  },
  fonts: {
    src: basePath.src + '/styles/fonts-original/',
    dest: basePath.src + '/fonts/',
  },
  scripts: {
    src: ['_src/scripts/**/*.coffee', '_src/scripts/**/*.ts', '_src/scripts/**/*.js'],
    dest: 'docs/js/'
  },  
}

// Массив для списка папок блоков
const blocks = [];


// Получаем список блоков и записываем их в массив blocks
if (basePath.blocks) {
  fs.readdirSync(basePath.blocks).forEach(function (directory) {
      blocks.push(directory);
  });
}

// Добавляем к paths.html.watch пути к блокам
blocks.forEach (function (block) {
  paths.html.watch.push(basePath.blocks + '/' + block + '/*.html');
});

// Добавляем к paths.stylesScss.watch пути к блокам
blocks.forEach (function (block) {
  paths.stylesScss.watch.push(basePath.blocks + '/' + block + '/*.scss');
});

// Добавляем к paths.images.watch пути к блокам
blocks.forEach (function (block) {
  paths.images.watch.push(basePath.blocks + '/' + block + '/*.{jpg,jpeg,png}');
});

// Добавляем к paths.imagesOpt.watch пути к блокам
blocks.forEach (function (block) {
  paths.imagesOpt.watch.push(basePath.imgOpt + '/' + block + '/*.{jpg,jpeg,png}');
});

// Очистить каталог docs, удалить все кроме изображений и шрифтов
function clean() {
  return del(['docs/*', '!docs/img', '!docs/fonts'])
}

// Очистить каталог docs полностью
function reset() {
  return del(basePath.dev)
}
// Тестовая задача по копированию
function copy() {
  return gulp.src(paths.files.src)
   .pipe(gulp.dest(paths.files.dest))
}

// Обработка html и pug

function html() {
  return gulp.src(paths.html.src)
  // Уведомления об ошибках
  .pipe(plumber(
    notify.onError({
        title: "Ошибка HTML",
        message: "Error: <%= error.message %>"
    }))
  )
  .pipe(posthtml([
    include()
  ]))

  // Подмена путей до изображений
  .pipe(replace('../', '/img/'))
  .pipe(versionNumber({
		'value' : '%DT%',
    'append' : {
      'key' : '_v',
      'cover' : 0,
        'to' : [
            'css',
            'js',
        ]
    },
    'output' : {
        'file' : './_src/version.json'
    }
  }))
  .pipe(htmlBeautify())
  .pipe(size({
    showFiles:true
  }))
  .pipe(gulp.dest(paths.html.dest))
  .pipe(browsersync.stream())
}

// Обработка препроцессоров стилей
function stylesScss() {
  return gulp.src(paths.stylesScss.src)
  .pipe(sourcemaps.init())
  .pipe(plumber(
    notify.onError({
        title: "Ошибка SCSS",
        message: "Error: <%= error.message %>"
    }))
  )
  // Преобразование в css
  .pipe(sass({
    outputStyle: 'expanded'
  }))

  .pipe(groupCssMediaQueries())

  // Подмена путей до изображений
  .pipe(replace('../', '../img/'))
  .pipe(replace('./src/fonts/', '../fonts/'))

  .pipe(autoprefixer(
    {
        grid: true,
        overrideBrowserlist: ["last 3 versions"],
        cascade: true
    }
  ))  
  .pipe(sourcemaps.write('.'))
  

  .pipe(gulp.dest(paths.stylesScss.dest))

  .pipe(cleanCSS({
    level: 2
  }))

  .pipe(rename({
    basename: 'style',
    suffix: '.min'
  }))  
  
  
  .pipe(size({
    showFiles:true
  }))
  .pipe(gulp.dest(paths.stylesScss.dest))
  .pipe(browsersync.stream())
}

// Обработка Java Script, Type Script и Coffee Script
function scripts() {
  return gulp.src(paths.scripts.src)
  .pipe(sourcemaps.init())
  //.pipe(coffee({bare: true}))
  /*
  .pipe(ts({
    noImplicitAny: true,
    outFile: 'main.min.js'
  }))
  */
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(uglify())
  .pipe(concat('main.min.js'))
  .pipe(sourcemaps.write('.'))
  .pipe(size({
    showFiles:true
  }))
  .pipe(gulp.dest(paths.scripts.dest))
  .pipe(browsersync.stream())
}

// Оптимизируем jpg и png с помощью стороннего сервиса tinypng.com (бесплатно 500 файлов в месяц)
function imgopt(done) {
  blocks.forEach (function (block) {
    console.log(block)
    return gulp.src(paths.images.src + '/' + block + '/*.{jpg,jpeg,png}')    
    .pipe(newer(paths.images.dest + '/' + block + '/'))
    .pipe(tinypng({
        key: 'jO4jokCHdaoyAiRSqQifbkbQzjh9LaQD',
        sigFile: paths.images.dest + '/.tinypng-sigs',
        log: true,
    }))
    .pipe(gulp.dest(paths.images.dest + '/' + block + '/'))
    
  });
  
  done();
}

// Оптимизируем svg
function svgopt(done) {
  blocks.forEach (function (block) {
    return gulp.src(paths.images.src + '/' + block + '/*.svg')
    .pipe(plumber(
      notify.onError({
          title: "Ошибка SVG OPT",
          message: "Error: <%= error.message %>"
      }))
    )
    .pipe(newer(paths.images.dest + '/' + block + '/'))

    .pipe(svgo({
      plugins: [
          {removeXMLNS: false},
          {removeUselessStrokeAndFill: false},
          {convertColors: true},
          {removeAttrs: '(style)'},
          {removeViewBox: false},
          {sortAttrs: true}
      ]
    }))
    
    .pipe(gulp.dest(paths.images.dest + '/' + block + '/'))
  });
  done();
}

function imgresponsive(done) {
  blocks.forEach (function (block) {
    const config = responsiveConfig([
        basePath.blocks + '/' + block + '/*.scss',
        basePath.blocks + '/' + block + '/*.html'
    ]);

    // Возьми все изображения из папки
    return gulp.src(basePath.imgOpt + '/' + block + '/*.{jpg,jpeg,png}')

        .pipe(plumber(
            notify.onError({
                title: "Ошибка задачи IMAGES",
                message: "Error: <%= error.message %>"
            }))
        )

        .pipe(responsive(config, {
            errorOnEnlargement: false,
            quality: 80,
            withMetadata: false,
            compressionLevel: 7,
        }))
        .pipe(gulp.dest(paths.imagesOpt.dest + block + '/'))

  });
  done();
}

function imgwebp() {
  return gulp.src(basePath.dev + '/img/**/*.{jpg,jpeg,png}')
  .pipe(webp())
  .pipe(gulp.dest(basePath.dev + '/img/'))
}

function copySvg() {
  return gulp.src(paths.imagesOpt.src + '/**/*.svg')
  // Уведомления об ошибках
  .pipe(plumber(
    notify.onError({
        title: "Ошибка копирования SVG",
        message: "Error: <%= error.message %>"
    }))
  )
  .pipe(newer(paths.imagesOpt.dest))
  .pipe(gulp.dest(paths.imagesOpt.dest))
}

function svgSprive() {
  let config = {
    mode: {
        symbol: {
            dest : '',
            sprite: 'sprite.svg',
        }
    },
    svg: {
        namespaceClassnames: false,
        xmlDeclaration: true,
    },
    shape: {
        spacing: {
            padding: 0
        },
        transform: [{
            "svgo": {
                "plugins": [
                    {
                        name: 'removeXMLNS',
                        params: {
                            opationName: 'true'
                        }
                    },

                ]
            }
        }]
    },
  };

  return gulp.src(paths.svgicons.src, {})
  .pipe(plumber(
      notify.onError({
          title: "Ошибка создания SVG-спрайта",
          message: "Error: <%= error.message %>"
      }))
  )
  .pipe(replace('fill="none" ', ''))
  .pipe(svgSprite(config))
  .pipe(gulp.dest(paths.svgicons.dest))
}

function otfToTtf() {
  // Ищем файлы шрифтов .otf
  return gulp.src(paths.fonts.src + '*.otf', {})
        // Уведомления об ошибках
        .pipe(plumber(
          notify.onError({
              title: "Ошибка FONTS",
              message: "Error: <%= error.message %>"
          }))
        )
        // Конвертируем в .ttf
        .pipe(fonter({
            formats: ['ttf']
        }))
        // Выгружаем в исходную папку
        .pipe(gulp.dest(paths.fonts.src))
}

function ttfToWoff() {
  // Ищем файлы шрифтов .ttf
  return gulp.src(paths.fonts.src + '*.ttf', {})
      // Уведомления об ошибках
      .pipe(plumber(
        notify.onError({
            title: "Ошибка FONTS",
            message: "Error: <%= error.message %>"
        }))
      )
      // Конвертируем в .woff
      .pipe(fonter({
          formats: ['woff']
      }))
      // Выгружаем в папку c результатом
      .pipe(gulp.dest(paths.fonts.dest))

      // Ищем файлы шрифтов .ttf
      .pipe(gulp.src(paths.fonts.src + '*.ttf'))
      // Конвертируем в .woff2
      .pipe(ttf2woff2())
      // Выгружаем в папку c результатом
      .pipe(gulp.dest(paths.fonts.dest))
}

// Формирование и подключение файла шрифтов в стили
function fontsStyle() {
  // Файл стилей подключения шрифтов
  let fontsFile = basePath.src + '/styles/fonts.scss';

  // Проверяем существуют ли файлы шрифтов
  fs.readdir(paths.fonts.dest, function (err, fontsFiles){
      if (fontsFiles) {
          // Проверяем существует ли файл стилей для подключения шрифтов
          if (!fs.existsSync(fontsFile)) {
              // Если файла нет, создаем его
              fs.writeFile(fontsFile, '', cb);
              let newFileOnly;
              for (let i = 0; i < fontsFiles.length; i++) {
                  // Записываем подключения шрифтов в файл стилей
                  let fontFileName = fontsFiles[i].split('.')[0];
                  if (newFileOnly !== fontFileName) {
                      let fontName = fontFileName.split('-')[0] ? fontFileName.split('-')[0] : fontFileName;
                      let fontWeight = fontFileName.split('-')[1] ? fontFileName.split('-')[1] : fontFileName;
                      let fontStyle = 'normal';
                      if (fontWeight.toLowerCase() === 'thinitalic') {
                          fontWeight = 100,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'extralightitalic') {
                          fontWeight = 200,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'lightitalic') {
                          fontWeight = 300,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'mediumitalicitalic') {
                          fontWeight = 500,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'semibolditalic') {
                          fontWeight = 600,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'bolditalic') {
                          fontWeight = 700,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'extrabolditalic') {
                          fontWeight = 800,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'blackitalic') {
                          fontWeight = 900,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'italic') {
                          fontWeight = 400,
                          fontStyle = 'italic';
                      } else if (fontWeight.toLowerCase() === 'thin') {
                          fontWeight = 100;
                      } else if (fontWeight.toLowerCase() === 'extralight') {
                          fontWeight = 200;
                      } else if (fontWeight.toLowerCase() === 'light') {
                          fontWeight = 300;
                      } else if (fontWeight.toLowerCase() === 'medium') {
                          fontWeight = 500;
                      } else if (fontWeight.toLowerCase() === 'semibold') {
                          fontWeight = 600;
                      } else if (fontWeight.toLowerCase() === 'bold') {
                          fontWeight = 700;
                      } else if (fontWeight.toLowerCase() === 'extrabold') {
                          fontWeight = 800;
                      } else if (fontWeight.toLowerCase() === 'black') {
                          fontWeight = 900;
                      } else {
                          fontWeight = 400;
                      }
                      fs.appendFile(fontsFile,
                      `@font-face {\n\tfont-family: "${fontName}";\n\tfont-display: swap;\n\tsrc:\n\t\tlocal("${fontName}"),\n\t\turl("./src/fonts/${fontFileName}.woff2") format("woff2"),\n\t\turl("./src/fonts/${fontFileName}.woff") format("woff");\n\tfont-weight: ${fontWeight};\n\tfont-style: ${fontStyle};\r\n}\r\n`,cb);
                      newFileOnly = fontFileName;
                  }
              }
          } else {
              // Если файл есть, выводим сообщение
              console.log("Файл scss/fonts.scss уже существует. Для обновления файла нужно его удалить!")
          }
      }
  });

  return gulp.src(basePath.src + '/styles/');
  function cb() {}
}

function copyFonts() {
  return gulp.src(basePath.src + '/fonts/**.{woff,woff2}')
    .pipe(newer(basePath.dev + '/fonts/'))
    .pipe(gulp.dest(basePath.dev + '/fonts/'))
}

// Отслеживание изменений в файлах и запуск лайв сервера
function watch() {  
  browsersync.init({
    server: {
        baseDir: basePath.dev
    }
  })
  gulp.watch(paths.html.dest).on('change', browsersync.reload)
  gulp.watch(paths.files.watch, copy)
  gulp.watch(paths.html.watch, html)
  gulp.watch(paths.stylesScss.watch, stylesScss)
  gulp.watch(paths.scripts.src, scripts)
  gulp.watch(paths.images.src, imgopt, svgopt)
  //gulp.watch(paths.imagesOpt.src, img, copySvg)
  gulp.watch(paths.svgicons.watch, svgSprive)
}

// Таски для ручного запуска с помощью gulp clean, gulp html и т.д.
exports.reset = reset
exports.clean = clean
exports.copy = copy
exports.html = html
exports.styles = stylesScss
exports.scripts = scripts
exports.imgopt = imgopt
exports.svgopt = svgopt
exports.imgresponsive = imgresponsive
exports.imgwebp = imgwebp
exports.copySvg = copySvg
exports.svgSprive = svgSprive
exports.copyFonts = copyFonts
exports.watch = watch

// Последовательная обработка шрифтов (отдельная задача, не включена в сценарии)
const fonts = gulp.series(otfToTtf, ttfToWoff, fontsStyle);

// Нарезка изображений и создание webp (отдельная задача, не включена в сценарии)
const img = gulp.series(imgresponsive, imgwebp);

// Основные задачи
const mainTasks = gulp.parallel(stylesScss, scripts, img);

// Построение сценариев выполнения задач
const dev = gulp.series(clean, copyFonts, svgopt, svgSprive, copy, html, mainTasks, watch);

// Таск, который выполняется по команде gulp
exports.default = dev;

// Таск, который выполняется по команде gulp fonts
exports.fonts = fonts;

// Таск, который выполняется по команде gulp fonts
exports.img = img;