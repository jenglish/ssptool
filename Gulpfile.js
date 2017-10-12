
var gulp = require('gulp')
  , jsdoc = require('gulp-jsdoc3')
  , eslint = require('gulp-eslint')
  ;

gulp.task('jsdoc', function (cb) {
    gulp.src(['./lib/**/*.js'])
        .pipe(jsdoc(cb));
    }
);

gulp.task('eslint', function () {
    gulp.src(['./lib/**/*.js', '*.js', 'commands/*.js', 'test/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
    }
);

