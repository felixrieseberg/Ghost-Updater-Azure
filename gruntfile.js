module.exports = function(grunt) {
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: [ 'Gruntfile.js', 'updater_client/**/*.js', 'app.js', 'updater/**/*.js'],
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
                tasks: [ 'concat' ]
            }
        },

        nodemon: {
            dev: {
                script: 'app.js'
            }
        },

        nwjs: {
            win: {
                options: {
                    name: 'Ghost Updater for Azure',
                    platforms: ['win'],
                    buildDir: './builds',
                    winIco: './public/images/icon.ico',
                    version: '0.12.2'
                },
                src: ['public/**/*', 'node_modules/**/*', '!node_modules/grunt**/**', 'updater/**/*', 'updater_client/**/*', 'views/**/*', '*.js', '*.html', '*.json'] // Your node-webkit app
            },
            unix: {
                options: {
                    name: 'Ghost Updater for Azure',
                    platforms: ['osx', 'linux32'],
                    buildDir: './builds',
                    macIcns: './public/images/icon.icns',
                    winIco: './public/images/icon.ico'
                },
                src: ['public/**/*', 'node_modules/**/*', '!node_modules/grunt**/**', 'updater/**/*', 'updater_client/**/*', 'views/**/*', '*.js', '*.html', '*.json'] // Your node-webkit app
            }
        },

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nw-builder');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('buildwin', ['concat', 'nwjs:win']);
    grunt.registerTask('buildunix', ['concat', 'nwjs:unix']);
    grunt.registerTask('buildandrun', ['concat', 'nodemon']);
    grunt.registerTask('dev', ['concat', 'concurrent']);
    grunt.registerTask('default', ['jshint']);
};
