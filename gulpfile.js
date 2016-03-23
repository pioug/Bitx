const del = require('del')
const gulp = require('gulp')
const sass = require('gulp-sass')

gulp.task('styles', () => {
  return gulp.src('app/scss/**/*')
    .pipe(sass())
    .pipe(gulp.dest('build/css'))
})

gulp.task('assets', () => {
  return gulp.src([
      '!app/scss/**/*',
      'app/**'
    ])
    .pipe(gulp.dest('build'))
})

gulp.task('default', ['assets', 'styles'])

gulp.task('clean', () => del('build'));
