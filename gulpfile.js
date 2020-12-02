// include gulp
var gulp = require('gulp')

// include plug-ins
var changed = require('gulp-changed')
var minifyHTML = require('gulp-minify-html')
var concat = require('gulp-concat')
var stripDebug = require('gulp-strip-debug')
var uglify = require('gulp-uglify')
var autoprefix = require('gulp-autoprefixer')
var cleanCSS = require('gulp-clean-css')
//var del = require('del')

// minify new or changed HTML pages
gulp.task('htmlpage', function(d) {
  // The 'd' callback signals async completion, preventing an error. 
  var htmlSrc = './src/client/*.html',
      htmlDst = './build/served/'

  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));

  d()
})

// JS concat, strip debugging and minify
gulp.task('scripts', function(d) {
  gulp.src(['./src/client/js/libs/*.js', './src/client/js/qpo.js', './src/client/js/*.js', './src/client/js/title/title.js'])
    .pipe(concat('title_script.js'))
    // .pipe(stripDebug())
    // .pipe(uglify())
    .pipe(gulp.dest('./build/served/')
  );
  // gulp.src(['./src/client/js/libs/*.js', './src/client/js/qpo.js', './src/client/js/*.js', './src/client/js/menu/menu.js'])
  //   .pipe(concat('menu_script.js'))
  //   // .pipe(stripDebug())
  //   // .pipe(uglify())
  //   .pipe(gulp.dest('./build/served/')
  // );
  gulp.src(['./src/server/server.js'])
    .pipe(concat('server.js'))
    // .pipe(stripDebug())
    // .pipe(uglify())
    .pipe(gulp.dest('./build/')
  );

  d()
});

// package.json update
gulp.task('package', function(d) {
  gulp.src(['./src/server/package.json'])
    .pipe(concat('package.json'))
    // .pipe(stripDebug())
    // .pipe(uglify())
    .pipe(gulp.dest('./build/')
  );

  d()
});

// CSS concat, auto-prefix and minify
gulp.task('styles', function(d) {
  gulp.src(['./src/client/css/*.css'])
    .pipe(concat('style.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(cleanCSS())
    .pipe(gulp.dest('./build/served/')
  );

  d()
});

gulp.task('default', gulp.parallel(['htmlpage', 'scripts', 'package', 'styles'], function(d){
  gulp.watch('./src/*.html', function(){
    gulp.run('htmlpage')
  })

  gulp.watch(['./src/client/js/*.js', './src/client/js/title/*.js', './src/server/*.js'], function(){
    gulp.run('scripts');
  })

  gulp.watch(['./src/server/package.json'], function(){
    gulp.run('package');
  })

  gulp.watch('./src/styles/*.css', function(){
     gulp.run('styles')
  })

  d()
}))
