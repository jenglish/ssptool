/*! vim: set et sw=4 :*/

var gulp = require('gulp')
  , jsdoc = require('gulp-jsdoc3')
  ;

gulp.task('jsdoc', function (cb) {
    gulp.src(['./lib/**/*.js'])
        .pipe(jsdoc(cb));
    }
);

