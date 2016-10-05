module.exports = function(grunt){

  //Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      client: {
        files: {
          'build/script.js': ['src/client/js/libs/*.js', 'src/client/js/qpo.js', 'src/client/js/*.js']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/script.js',
        dest: 'build/script.min.js'
      }
    }
  });

  // Load the plugin that provide the tasks
  grunt.loadNpmTasks('grunt-install-dependencies');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default tasks
  grunt.registerTask('default', ['concat'/*, 'uglify'*/]);
}
