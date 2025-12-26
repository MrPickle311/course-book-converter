package com.bcc

import org.junit.jupiter.api.Test
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter
import java.nio.file.Files

class BackendKotlinApplicationTest {


    @Test
    fun `verify modular structure`() {
        val modules = ApplicationModules.of("com.bcc")

        modules.forEach { println(it) }

        modules.verify()

        val isCourseUsingFiles = modules.getModuleForPackage("com.bcc.course")
            .get()
            .contains(Files::class.java)
        assert(!isCourseUsingFiles)

        Documenter(modules)
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml()
    }
}