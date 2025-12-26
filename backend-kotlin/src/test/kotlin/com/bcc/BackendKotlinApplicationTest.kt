package com.bcc

import com.tngtech.archunit.core.domain.JavaClass
import org.junit.jupiter.api.Test
import org.springframework.modulith.core.ApplicationModules

class BackendKotlinApplicationTest {

    @Test
    fun `verify modular structure`() {
        val modules = ApplicationModules.of(BackendKotlinApplication::class.java,
            JavaClass.Predicates.resideInAPackage("com.bcc.api.."))

        modules.forEach { println(it) }

        val violations = modules.detectViolations().messages.filter { !it.contains("Cycle") }

        assert(violations.isEmpty()) { println(violations) }
    }
}