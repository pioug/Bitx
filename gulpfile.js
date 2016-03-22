const gulp = require('gulp')
const sass = require('gulp-sass')

gulp.task('styles', () => {
  return gulp.src('app/scss/**/*')
    .pipe(sass())
    .pipe(gulp.dest('app/css'))
})
