var gulp = require('gulp'),
    gp_concat = require('gulp-concat'),
    gp_rename = require('gulp-rename'),
    gp_uglify = require('gulp-uglify'),
    gp_babel  = require('gulp-babel'),
    gp_jsonlint = require("gulp-jsonlint");

gulp.task('default', function() {
  gulp.src(['js/*.js'])
        /*.pipe(gp_jsonlint())
        .pipe(gp_jsonlint.reporter())*/
        .pipe(gp_babel({presets: ['es2015']}))
        .pipe(gp_concat('concat.js'))
        .pipe(gulp.dest('src'))
        .pipe(gp_rename('uglify.js'))
        .pipe(gp_uglify().on('error', function(e){
            console.log(e);
         }))
        .pipe(gulp.dest('src'));    

  gulp.src(['js/utility.js','profile/js/main.js'])
      .pipe(gp_babel({presets: ['es2015']}))
        .pipe(gp_concat('concatProfile.js'))
        .pipe(gulp.dest('src'))
        .pipe(gp_rename('uglifyProfile.js'))
        .pipe(gp_uglify().on('error', function(e){
            console.log(e);
         }))
        .pipe(gulp.dest('src'));
});