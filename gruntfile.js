module.exports = function(grunt) {
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: [ 'Gruntfile.js', 'public/scripts/*.js', 'app.js', 'updater/**/*.js'],
            options: {
                jshintrc: true
            }
        },

        concurrent: {
            dev: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },

        concat: {
            options: {
                separator: '',
                stripBanners: true,
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %> */'
            },
            dist: {
                src: ['updater_client/*.js'],
                dest: 'public/scripts/built.js',
            },
        },

        watch: {
            all: {
                files: ['updater_client/**/*.js', 'updater/**/**.js'],
                tasks: [ 'build' ]
            }
        },

        nodemon: {
            dev: {
                script: 'app.js'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('build', ['concat']);
    grunt.registerTask('buildandrun', ['concat', 'nodemon']);
    grunt.registerTask('dev', ['concurrent']);
    grunt.registerTask('default', ['jshint']);
};
