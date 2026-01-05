package com.bcc.notifications

import org.springframework.modulith.NamedInterface
import org.springframework.modulith.PackageInfo

data class NotificationEvent(val message: String)

@PackageInfo
@NamedInterface("spi")
class ModuleMetadata {}
