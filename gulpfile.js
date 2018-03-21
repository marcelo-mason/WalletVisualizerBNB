var gulp = require('gulp')
const nodemon = require('gulp-nodemon')
const babel = require('gulp-babel')
const Cache = require('gulp-file-cache')

var cache = new Cache()

gulp.task('compile', function() {
  var stream = gulp
    .src('app/scripts/**/*.js') // your ES2015 code
    .pipe(cache.filter()) // remember files
    .pipe(
      babel({
        presets: ['es2015'],
        plugins: ['transform-object-rest-spread']
      })
    ) // compile new ones
    .pipe(cache.cache()) // cache them
    .pipe(gulp.dest('wwwroot/js')) // write them
  return stream // important for gulp-nodemon to wait for completion
})

gulp.task('watch', ['compile'], function() {
  var stream = nodemon({
    script: 'server.js',
    watch: 'app/scripts', // watch ES2015 code
    tasks: ['compile'] // compile synchronously onChange
  })
  return stream
})
