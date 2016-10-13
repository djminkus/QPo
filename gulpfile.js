// include gulp
var gulp = require('gulp');

// include plug-ins
var changed = require('gulp-changed')
var minifyHTML = require('gulp-minify-html')

var concat = require('gulp-concat')
var stripDebug = require('gulp-strip-debug')
var uglify = require('gulp-uglify')

var autoprefix = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

// minify new or changed HTML pages
gulp.task('htmlpage', function() {
  var htmlSrc = './src/client/*.html',
      htmlDst = './build/served/'

  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
})

// JS concat, strip debugging and minify
gulp.task('scripts', function() {
  gulp.src(['./src/client/js/libs/*.js','./src/client/js/qpo.js', './src/client/js/*.js'])
    .pipe(concat('script.js'))
    .pipe(stripDebug())
    // .pipe(uglify())
    .pipe(gulp.dest('./build/served/')
  );
  gulp.src(['./src/server/server.js'])
    .pipe(concat('server.js'))
    // .pipe(stripDebug())
    // .pipe(uglify())
    .pipe(gulp.dest('./build/')
  );
});

// CSS concat, auto-prefix and minify
gulp.task('styles', function() {
  gulp.src(['./src/client/css/*.css'])
    .pipe(concat('style.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(cleanCSS())
    .pipe(gulp.dest('./build/served/'));
});

gulp.task('default', ['htmlpage', 'scripts', 'styles'], function(){
  // gulp.watch('./src/*.html', function(){
  //   gulp.run('htmlpage')
  // })
  //
  // //Note: libraries are not watched for changes.
  gulp.watch(['./src/client/js/*.js', './src/server/*.js'], function(){
    gulp.run('scripts')
  })
  //
  // gulp.watch('./src/styles/*.css', function(){
  //   gulp.run('styles')
  // })
})
