var gulp = require('gulp'); 

//For cleaning out the build dir
var clean = require('gulp-clean');

//For processing react and other files into minimized files
var rename = require('gulp-rename');

var react = require('gulp-react');

var gutil = require("gulp-util");
var fs = require("fs");

// Delete everything inside the dist directory
gulp.task('clean', function() {
  return gulp.src(['dist/*'], {read: false}).pipe(clean());
});

// Copy all bootstrap files from node_modules/bootstrap/dist:
gulp.task('build_assets', function() {
    gutil.log("copy assets from mock to dist");

    return gulp.src(['mock/impl/css/*','mock/impl/fonts/*','mock/impl/images/*','mock/impl/js/*'],
                    {base: 'mock/impl/'})
        .pipe(gulp.dest('dist'));
});

gulp.task("default", ["build_assets"] );