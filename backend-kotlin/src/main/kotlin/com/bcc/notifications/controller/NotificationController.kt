package com.bcc.notifications.controller

import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArrayList

@RestController
class NotificationController {
    private val logger = LoggerFactory.getLogger(NotificationController::class.java)

    private val emitters = CopyOnWriteArrayList<SseEmitter>()

    @GetMapping(value = ["/subscribe"], produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun subscribe(): SseEmitter {
        val emitter = SseEmitter(Long.MAX_VALUE)

        emitters.add(emitter)

        cleanupOnDisconnectionOrTimeout(emitter)

        return emitter
    }

    private fun cleanupOnDisconnectionOrTimeout(emitter: SseEmitter) {
        emitter.onCompletion { emitters.remove(emitter) }
        emitter.onError { emitters.remove(emitter) }
        emitter.onTimeout { emitters.remove(emitter) }
    }

    fun sendNotification(message: String) {
        for (emitter in emitters) {
            try {
                emitter.send(
                    SseEmitter
                    .event()
                    .name("notification")
                    .data(message))
                logger.info("Sent event: $message")
            } catch (e: Exception) {
                logger.error("Error while sending notification: ${e.message}")
                emitters.remove(emitter)
            }
        }
    }
}