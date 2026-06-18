const {
  withDangerousMod,
  withAppBuildGradle,
  withProjectBuildGradle,
} = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

// Copy google-services.json into android/app/
const withCopyGoogleServicesAndroid = (config) =>
  withDangerousMod(config, [
    'android',
    (cfg) => {
      const src = path.resolve(cfg.modRequest.projectRoot, 'google-services.json')
      const dest = path.resolve(cfg.modRequest.platformProjectRoot, 'app', 'google-services.json')
      if (fs.existsSync(src)) fs.copyFileSync(src, dest)
      return cfg
    },
  ])

// Copy GoogleService-Info.plist into ios/<ProjectName>/
const withCopyGoogleServicesIos = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const src = path.resolve(cfg.modRequest.projectRoot, 'GoogleService-Info.plist')
      const dest = path.resolve(
        cfg.modRequest.platformProjectRoot,
        cfg.modRequest.projectName,
        'GoogleService-Info.plist',
      )
      if (fs.existsSync(src)) fs.copyFileSync(src, dest)
      return cfg
    },
  ])

// Add com.google.gms:google-services classpath to android/build.gradle
const withGoogleServicesClasspath = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    const classpath = "classpath('com.google.gms:google-services:4.4.2')"
    if (!cfg.modResults.contents.includes('com.google.gms:google-services')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n        ${classpath}`,
      )
    }
    return cfg
  })

// Apply com.google.gms.google-services plugin in android/app/build.gradle
// MUST be appended AFTER com.android.application — never prepended
const withApplyGoogleServicesPlugin = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes('com.google.gms.google-services')) {
      cfg.modResults.contents =
        cfg.modResults.contents.trimEnd() +
        `\napply plugin: 'com.google.gms.google-services'\n`
    }
    return cfg
  })

const withGoogleServicesJson = (config) => {
  config = withCopyGoogleServicesAndroid(config)
  config = withCopyGoogleServicesIos(config)
  config = withGoogleServicesClasspath(config)
  config = withApplyGoogleServicesPlugin(config)
  return config
}

module.exports = withGoogleServicesJson
