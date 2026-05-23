const { src, dest, parallel } = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

const babelOptions = { presets: ['@babel/preset-env'] };

function onUglifyError(err) {
  console.log(err);
  this.emit('end');
}

function buildMain() {
  return src(['js/*.js'])
    .pipe(babel(babelOptions))
    .pipe(concat('concat.js'))
    .pipe(dest('src'))
    .pipe(rename('uglify.js'))
    .pipe(uglify().on('error', onUglifyError))
    .pipe(dest('src'));
}

function buildProfile() {
  return src(['js/utility.js', 'profile/js/main.js'])
    .pipe(babel(babelOptions))
    .pipe(concat('concatProfile.js'))
    .pipe(dest('src'))
    .pipe(rename('uglifyProfile.js'))
    .pipe(uglify().on('error', onUglifyError))
    .pipe(dest('src'));
}

exports.buildMain = buildMain;
exports.buildProfile = buildProfile;
exports.default = parallel(buildMain, buildProfile);
