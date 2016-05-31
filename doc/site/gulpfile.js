var gulp = require('gulp');

//For cleaning out the build dir
var clean = require('gulp-clean');

//For processing react and other files into minimized files
var rename = require('gulp-rename');

var react = require('gulp-react');

var gutil = require("gulp-util");
var fs = require("fs");
var include = require('gulp-html-tag-include');

// Delete everything inside the dist directory
gulp.task('clean', function() {
  return gulp.src(['dist/*'], {read: false}).pipe(clean());
});

gulp.task('build_lightbox_css', function() {
    gutil.log("copy css assets from ekko-lightbox to dist");

    return gulp.src('../../node_modules/ekko-lightbox/dist/*.css')
        .pipe(gulp.dest('dist/css'));
});
gulp.task('build_lightbox_js', function() {
    gutil.log("copy assets from ekko-lightbox to dist");

    return gulp.src('../../node_modules/ekko-lightbox/dist/*.js')
        .pipe(gulp.dest('dist/js'));
});

gulp.task('build_lightbox', [ 'build_lightbox_css', 'build_lightbox_js'] );

gulp.task('build_mock_assets', function() {
    gutil.log("copy assets from mock to dist");

    return gulp.src(['mock/impl/css/*','mock/impl/fonts/*','mock/impl/images/*','mock/impl/js/*'],
                    {base: 'mock/impl/'})
        .pipe(gulp.dest('dist'));
});

gulp.task('build_app_assets', function() {
    gutil.log("copy assets from mock to dist");

    return gulp.src(['../../src/tabli-core/src/html/*','../../src/tabli-core/src/assets/*'],
                    {base: '../../src/tabli-core/src/'})
        .pipe(gulp.dest('dist'));
});


gulp.task('build_assets', ['build_mock_assets','build_app_assets']);

gulp.task('build_favicon', function() {
  gutil.log("copy favicon dir to dist");

  return gulp.src('tabli-favicon.ico/*')
    .pipe(gulp.dest('dist/favicon'));
});

gulp.task('html-include', ['build_assets', 'build_lightbox', 'build_favicon'], function() {
    return gulp.src('./src/*.html')
        .pipe(include())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', ['html-include'], function() {
    gulp.watch('./src/**/*.html', ['html-include']);
});

gulp.task('default', ['watch']);
