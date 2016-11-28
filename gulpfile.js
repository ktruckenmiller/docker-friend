'use strict';
// javascript
var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');

gulp.task('javascript', function () {
  // set up the browserify instance on a task basis
  return browserify('./lib/script.js')
            .bundle()
            .pipe(source('script.js'))
            .pipe(gulp.dest('./app/public/js/'));
});

// css
var sass = require('gulp-sass');

gulp.task('sass', function () {
  return gulp.src('./app/public/sass/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./app/public/css'));
});

gulp.task('develop', function () {
  gulp.watch('./app/public/sass/**/*.scss', ['sass']);
  gulp.watch('./lib/**/*.js', ['javascript'])

});
