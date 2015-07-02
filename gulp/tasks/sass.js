var gulp         = require('gulp');
var browserSync  = require('browser-sync');
var sass         = require('gulp-sass');
var compass      = require('gulp-compass');
// var sourcemaps   = require('gulp-sourcemaps');
var handleErrors = require('../util/handleErrors');
var config       = require('../config').compass;
//var autoprefixer = require('gulp-autoprefixer');

gulp.task('sass', ['images'], function () {
  return gulp.src(config.src)
    // .pipe(sourcemaps.init())
    .pipe(compass(config.settings))
    .on('error', handleErrors)
    // .pipe(sourcemaps.write())
    // .pipe(autoprefixer({ browsers: ['last 2 version'] }))
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
