'use strict'

const browserify = require('browserify')
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
    entries: 'app/background.js',
  })
  .bundle()
  .pipe(source('background.js'))
  .pipe(gulp.dest('build'))
)

gulp.task('scripts:options', () => {
  browserify({
    entries: 'app/options.js',
  })
  .bundle()
  .pipe(source('options.js'))
  .pipe(gulp.dest('build'))
})

gulp.task('assets', () => {
  gulp.src([
    '!app/scss/**/*',
    '!app/js/badge.js',
    'app/**'
  ])
  .pipe(gulp.dest('build'))
})

gulp.task('build', [
  'assets',
  'scripts:background',
  'scripts:options',
  'styles'
])

gulp.task('clean', () => del('build'))

gulp.task('default', () =>
  gulp.watch('app/**/*', ['build'])
)
