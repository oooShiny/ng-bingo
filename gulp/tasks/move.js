'use strict';
var gulp = require('gulp');
var include = require('gulp-include');

gulp.task('move', function() {
  return gulp.src('app/scripts/libs/modernizr.js')
    .pipe(gulp.dest('build/scripts/libs'));

  //  .pipe(gulp.src('app/scripts/directives/**/*.html'))
  //  .pipe(gulp.dest('build/scripts/scripts/directives'));
});
