const browserify = require('browserify')
const del = require('del')
const gulp = require('gulp')
const sass = require('gulp-sass')
const source = require('vinyl-source-stream');

gulp.task('styles', () => {
  return gulp.src('app/scss/**/*')
    .pipe(sass())
    .pipe(gulp.dest('build/css'))
})

gulp.task('scripts:background', () => {
  return browserify({
      entries: 'app/background.js',
    })
    .bundle()
    .pipe(source('background.js'))
    .pipe(gulp.dest('build'))
})

gulp.task('assets', () => {
  return gulp.src([
      '!app/scss/**/*',
      '!app/js/badge.js',
      'app/**'
    ])
    .pipe(gulp.dest('build'))
})

gulp.task('default', ['assets', 'scripts:background', 'styles'])

gulp.task('clean', () => del('build'));
