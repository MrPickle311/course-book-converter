package com.bcc.backend

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan

@ConfigurationPropertiesScan
@SpringBootApplication
class BackendKotlinApplication

fun main(args: Array<String>) {
	runApplication<BackendKotlinApplication>(*args)
}
