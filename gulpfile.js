'use strict'

const browserify = require('browserify')
const ngAnnotate = require('browserify-ngannotate')
const del = require('del')
const gulp = require('gulp')
const sass = require('gulp-sass')
const source = require('vinyl-source-stream')

gulp.task('styles', () =>
  gulp.src('app/scss/**/*')
    .pipe(sass())
    .pipe(gulp.dest('build/css'))
)

gulp.task('scripts:background', () =>
  browserify({
    debug: true,
    entries: 'app/background.js'
  })
  .bundle()
  .pipe(source('background.js'))
  .pipe(gulp.dest('build'))
)

gulp.task('scripts:options', () => {
  browserify({
    debug: true,
    entries: 'app/options.js'
  })
  .bundle()
  .pipe(source('options.js'))
  .pipe(gulp.dest('build'))
})

gulp.task('scripts:app', () => {
  browserify({
    debug: true,
    entries: 'app/js/app.js',
  })
  .transform('browserify-ngannotate', {
    sourcemap: false
  })
  .bundle()
  .pipe(source('app.js'))
  .pipe(gulp.dest('build'))
})

gulp.task('assets', () => {
  gulp.src([
    '!app/scss/**/*',
    '!app/js/**/*.js',
    'app/**/*'
  ])
  .pipe(gulp.dest('build'))
})

gulp.task('build', [
  'assets',
  'scripts:app',
  'scripts:background',
  'scripts:options',
  'styles'
])

gulp.task('clean', () => del('build'))

gulp.task('default', () => {
  gulp.start('build')
  gulp.watch('app/**/*', ['build'])
})
